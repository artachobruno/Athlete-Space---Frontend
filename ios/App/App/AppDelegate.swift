import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Hide web view navigation controls (back, refresh, etc.)
        // These controls appear as the input accessory view toolbar
        // The WKWebView extension handles hiding the toolbar automatically
        
        // Configure web view after a short delay to ensure it's loaded
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.configureWebView()
        }
        
        // Also configure when app becomes active (handles app returning from background)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(configureWebView),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        
        return true
    }
    
    @objc func configureWebView() {
        // Find and configure all WKWebViews to hide input accessory toolbar
        guard let window = self.window else {
            return
        }
        
        // Search through all windows and their view controllers
        if let rootViewController = window.rootViewController {
            self.hideToolbarInView(rootViewController.view)
        }
        
        // Also check all presented view controllers
        var currentVC = window.rootViewController
        while let presented = currentVC?.presentedViewController {
            self.hideToolbarInView(presented.view)
            currentVC = presented
        }
    }
    
    func hideToolbarInView(_ view: UIView) {
        // Recursively search for WKWebView
        // The WKWebView extension will handle hiding the input accessory view
        for subview in view.subviews {
            if subview is WKWebView {
                // The extension automatically hides the toolbar
                // Just configure keyboard dismiss mode
                if let webView = subview as? WKWebView {
                    webView.scrollView.keyboardDismissMode = .onDrag
                }
            }
            hideToolbarInView(subview)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
