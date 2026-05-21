import Foundation

enum GameMode: CaseIterable {
    case pvp
    case pveHard
    case pveMedium
    case pveEasy

    var aiDepth: Int {
        switch self {
        case .pvp: return 0
        case .pveHard: return 4
        case .pveMedium: return 2
        case .pveEasy: return 1
        }
    }

    var candidateRange: Int {
        switch self {
        case .pvp: return 0
        case .pveHard: return 1
        case .pveMedium: return 2
        case .pveEasy: return 3
        }
    }

    var maxCandidates: Int {
        switch self {
        case .pvp: return 0
        case .pveHard: return 10
        case .pveMedium: return 12
        case .pveEasy: return 15
        }
    }

    var isPVE: Bool {
        return self != .pvp
    }

    var displayName: String {
        switch self {
        case .pvp: return "人人对战"
        case .pveHard: return "AI 高级"
        case .pveMedium: return "AI 中级"
        case .pveEasy: return "AI 普通"
        }
    }
}
