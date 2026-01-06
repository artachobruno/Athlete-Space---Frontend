import { format } from 'date-fns';
import type { CalendarSession } from './api';

/**
 * Escapes special characters in ICS format
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Formats a date for ICS format (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Formats a date-only string for ICS format (YYYYMMDD)
 */
function formatIcsDateOnly(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, 'yyyyMMdd');
}

/**
 * Generates an ICS file from calendar sessions
 */
export function generateIcsFile(sessions: CalendarSession[]): string {
  const lines: string[] = [];
  
  // ICS Header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Athlete Space//Training Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  
  // Add each session as an event
  sessions.forEach((session) => {
    if (session.status === 'cancelled' || session.status === 'skipped') {
      return;
    }
    
    const sessionDate = new Date(session.date);
    const startDate = formatIcsDateOnly(session.date);
    
    // Use time if available, otherwise default to 6 AM
    let startDateTime = '';
    let endDateTime = '';
    
    if (session.time) {
      const [hours, minutes] = session.time.split(':').map(Number);
      const start = new Date(sessionDate);
      start.setHours(hours || 6, minutes || 0, 0, 0);
      startDateTime = formatIcsDate(start);
      
      // Calculate end time based on duration
      const duration = session.duration_minutes || 60;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);
      endDateTime = formatIcsDate(end);
    } else {
      // All-day event
      startDateTime = startDate;
      endDateTime = startDate;
    }
    
    const title = escapeIcsText(session.title || 'Training Session');
    const description = session.notes 
      ? escapeIcsText(session.notes)
      : escapeIcsText(`${session.type || 'Training'} session`);
    
    const location = session.type ? escapeIcsText(session.type) : '';
    
    // Generate unique ID
    const uid = `${session.id}@athlete-space.com`;
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${startDateTime}`);
    lines.push(`DTEND:${endDateTime}`);
    lines.push(`SUMMARY:${title}`);
    lines.push(`DESCRIPTION:${description}`);
    if (location) {
      lines.push(`LOCATION:${location}`);
    }
    lines.push(`STATUS:${session.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
    
    if (session.duration_minutes) {
      lines.push(`DURATION:PT${session.duration_minutes}M`);
    }
    
    lines.push('END:VEVENT');
  });
  
  // ICS Footer
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Downloads an ICS file
 */
export function downloadIcsFile(sessions: CalendarSession[], filename?: string): void {
  const icsContent = generateIcsFile(sessions);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `athlete-space-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

