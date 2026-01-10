import { type ProposalOnlyResponse, type WriteResponse } from "./api";
import type { AxiosResponse } from "axios";

/**
 * Checks if a response is a PROPOSAL_ONLY response that requires confirmation.
 */
export function isProposalOnlyResponse(response: unknown): response is ProposalOnlyResponse {
  if (!response || typeof response !== "object") return false;
  const resp = response as Record<string, unknown>;
  return resp.status === "PROPOSAL_ONLY";
}

/**
 * Extracts proposal from API response.
 */
export function extractProposal(response: unknown): ProposalOnlyResponse | null {
  if (isProposalOnlyResponse(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    const resp = response as Record<string, unknown>;
    // Check if response has a proposal property
    if (resp.proposal && isProposalOnlyResponse(resp.proposal)) {
      return resp.proposal as ProposalOnlyResponse;
    }

    // Check if response has status in a nested structure
    if (resp.status === "PROPOSAL_ONLY") {
      return resp as unknown as ProposalOnlyResponse;
    }
  }

  return null;
}

/**
 * Creates a retry payload with confirmed flag for write operations.
 */
export function createConfirmedPayload<T extends Record<string, unknown>>(
  originalPayload: T
): T & { confirmed: true } {
  return {
    ...originalPayload,
    confirmed: true,
  };
}

/**
 * Normalizes API response to check for PROPOSAL_ONLY status.
 * Handles both direct PROPOSAL_ONLY responses and wrapped responses.
 */
export function checkForProposalResponse(response: unknown): ProposalOnlyResponse | null {
  // Handle Axios response objects
  if (response && typeof response === "object" && "data" in response) {
    const axiosResponse = response as { data: unknown };
    return extractProposal(axiosResponse.data);
  }

  // Handle direct response
  return extractProposal(response);
}
