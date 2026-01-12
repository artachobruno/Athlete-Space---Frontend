import UIKit
import WebKit

extension WKWebView {
    // Override inputAccessoryView to return nil, hiding the navigation toolbar
    open override var inputAccessoryView: UIView? {
        return nil
    }
}
