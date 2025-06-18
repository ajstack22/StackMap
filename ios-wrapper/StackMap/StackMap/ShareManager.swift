import UIKit

class ShareManager {
    
    static func shareRoutine(text: String, from viewController: UIViewController) {
        let activityItems: [Any] = [
            text,
            URL(string: "https://stackmap.app")!
        ]
        
        let activityViewController = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        
        // Exclude certain activity types if needed
        activityViewController.excludedActivityTypes = [
            .addToReadingList,
            .assignToContact,
            .openInIBooks
        ]
        
        // Configure for iPad
        if let popover = activityViewController.popoverPresentationController {
            popover.sourceView = viewController.view
            popover.sourceRect = CGRect(
                x: viewController.view.bounds.midX,
                y: viewController.view.bounds.midY,
                width: 0,
                height: 0
            )
            popover.permittedArrowDirections = []
        }
        
        viewController.present(activityViewController, animated: true)
    }
    
    static func generateShareText(for routine: [String: Any]) -> String {
        let userName = routine["userName"] as? String ?? "User"
        let activities = routine["activities"] as? [[String: Any]] ?? []
        
        var shareText = "Check out \(userName)'s routine on StackMap:\n\n"
        
        for (index, activity) in activities.enumerated() {
            let emoji = activity["emoji"] as? String ?? "📌"
            let description = activity["description"] as? String ?? ""
            shareText += "\(index + 1). \(emoji) \(description)\n"
        }
        
        shareText += "\nCreate your own visual routines at stackmap.app"
        
        return shareText
    }
}