import Foundation
import NaturalLanguage
import SQLite3

// MARK: - Models

struct VaultTab: Codable {
    let id: String
    let url: String
    let title: String
    let favicon: String?
    let contentSnippet: String?
    let spaceName: String?
    let createdAt: Int64
    let lastAccessedAt: Int64
    let isPinned: Bool
    var score: Double?
}

struct IndexPayload: Codable {
    let id: String
    let url: String
    let title: String
    let favicon: String?
    let contentSnippet: String?
    let spaceName: String?
    let isPinned: Bool?
}

// MARK: - Vector Math Helper

func dotProduct(_ a: [Float], _ b: [Float]) -> Float {
    var sum: Float = 0.0
    let count = min(a.count, b.count)
    for i in 0..<count {
        sum += a[i] * b[i]
    }
    return sum
}

func vectorNorm(_ a: [Float]) -> Float {
    var sum: Float = 0.0
    for v in a {
        sum += v * v
    }
    return sqrt(sum)
}

func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Float {
    let normA = vectorNorm(a)
    let normB = vectorNorm(b)
    if normA == 0 || normB == 0 { return 0 }
    return dotProduct(a, b) / (normA * normB)
}

// MARK: - Vault Database

class LorVaultDB {
    private var db: OpaquePointer?
    private let embeddingModel = NLEmbedding.sentenceEmbedding(for: .english)

    init(path: String) {
        let fileManager = FileManager.default
        let folder = (path as NSString).deletingLastPathComponent
        try? fileManager.createDirectory(atPath: folder, withIntermediateDirectories: true)

        if sqlite3_open(path, &db) != SQLITE_OK {
            fputs("Error opening SQLite database at \(path)\n", stderr)
            exit(1)
        }
        setupSchema()
    }

    deinit {
        if db != nil {
            sqlite3_close(db)
        }
    }

    private func setupSchema() {
        let schema = """
        CREATE TABLE IF NOT EXISTS vault_tabs (
            id TEXT PRIMARY KEY,
            url TEXT,
            title TEXT,
            favicon TEXT,
            content_snippet TEXT,
            space_name TEXT,
            created_at INTEGER,
            last_accessed_at INTEGER,
            embedding BLOB,
            is_pinned INTEGER DEFAULT 0
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS vault_fts USING fts5(
            id UNINDEXED,
            title,
            url,
            content_snippet,
            space_name,
            tokenize = 'porter unicode61'
        );
        """
        sqlite3_exec(db, schema, nil, nil, nil)
    }

    func computeEmbedding(text: String) -> [Float]? {
        guard let model = embeddingModel else { return nil }
        guard let vector = model.vector(for: text) else { return nil }
        return vector.map { Float($0) }
    }

    func indexTab(payload: IndexPayload) -> Bool {
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        let textToEmbed = "\(payload.title). \(payload.contentSnippet ?? "")"
        let vector = computeEmbedding(text: textToEmbed)

        let insertSQL = """
        INSERT INTO vault_tabs (id, url, title, favicon, content_snippet, space_name, created_at, last_accessed_at, embedding, is_pinned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            url = excluded.url,
            title = excluded.title,
            favicon = excluded.favicon,
            content_snippet = excluded.content_snippet,
            space_name = excluded.space_name,
            last_accessed_at = excluded.last_accessed_at,
            embedding = excluded.embedding,
            is_pinned = excluded.is_pinned;
        """

        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, insertSQL, -1, &stmt, nil) == SQLITE_OK else {
            return false
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (payload.id as NSString).utf8String, -1, nil)
        sqlite3_bind_text(stmt, 2, (payload.url as NSString).utf8String, -1, nil)
        sqlite3_bind_text(stmt, 3, (payload.title as NSString).utf8String, -1, nil)
        
        if let fav = payload.favicon {
            sqlite3_bind_text(stmt, 4, (fav as NSString).utf8String, -1, nil)
        } else {
            sqlite3_bind_null(stmt, 4)
        }

        if let snippet = payload.contentSnippet {
            sqlite3_bind_text(stmt, 5, (snippet as NSString).utf8String, -1, nil)
        } else {
            sqlite3_bind_null(stmt, 5)
        }

        if let space = payload.spaceName {
            sqlite3_bind_text(stmt, 6, (space as NSString).utf8String, -1, nil)
        } else {
            sqlite3_bind_null(stmt, 6)
        }

        sqlite3_bind_int64(stmt, 7, now)
        sqlite3_bind_int64(stmt, 8, now)

        if let vec = vector {
            let data = vec.withUnsafeBufferPointer { Data(buffer: $0) }
            sqlite3_bind_blob(stmt, 9, (data as NSData).bytes, Int32(data.count), nil)
        } else {
            sqlite3_bind_null(stmt, 9)
        }

        sqlite3_bind_int(stmt, 10, (payload.isPinned ?? false) ? 1 : 0)

        guard sqlite3_step(stmt) == SQLITE_DONE else {
            return false
        }

        // Keep FTS updated
        let deleteFTS = "DELETE FROM vault_fts WHERE id = ?;"
        var delStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, deleteFTS, -1, &delStmt, nil) == SQLITE_OK {
            sqlite3_bind_text(delStmt, 1, (payload.id as NSString).utf8String, -1, nil)
            sqlite3_step(delStmt)
            sqlite3_finalize(delStmt)
        }

        let insertFTS = "INSERT INTO vault_fts (id, title, url, content_snippet, space_name) VALUES (?, ?, ?, ?, ?);"
        var ftsStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, insertFTS, -1, &ftsStmt, nil) == SQLITE_OK {
            sqlite3_bind_text(ftsStmt, 1, (payload.id as NSString).utf8String, -1, nil)
            sqlite3_bind_text(ftsStmt, 2, (payload.title as NSString).utf8String, -1, nil)
            sqlite3_bind_text(ftsStmt, 3, (payload.url as NSString).utf8String, -1, nil)
            sqlite3_bind_text(ftsStmt, 4, ((payload.contentSnippet ?? "") as NSString).utf8String, -1, nil)
            sqlite3_bind_text(ftsStmt, 5, ((payload.spaceName ?? "") as NSString).utf8String, -1, nil)
            sqlite3_step(ftsStmt)
            sqlite3_finalize(ftsStmt)
        }

        return true
    }

    func listTabs(limit: Int = 100) -> [VaultTab] {
        let query = "SELECT id, url, title, favicon, content_snippet, space_name, created_at, last_accessed_at, is_pinned FROM vault_tabs ORDER BY last_accessed_at DESC LIMIT ?;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, query, -1, &stmt, nil) == SQLITE_OK else {
            return []
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int(stmt, 1, Int32(limit))
        var tabs: [VaultTab] = []

        while sqlite3_step(stmt) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(stmt, 0))
            let url = String(cString: sqlite3_column_text(stmt, 1))
            let title = String(cString: sqlite3_column_text(stmt, 2))
            
            var favicon: String? = nil
            if let favCStr = sqlite3_column_text(stmt, 3) {
                favicon = String(cString: favCStr)
            }

            var snippet: String? = nil
            if let snipCStr = sqlite3_column_text(stmt, 4) {
                snippet = String(cString: snipCStr)
            }

            var space: String? = nil
            if let spaceCStr = sqlite3_column_text(stmt, 5) {
                space = String(cString: spaceCStr)
            }

            let createdAt = sqlite3_column_int64(stmt, 6)
            let lastAccessed = sqlite3_column_int64(stmt, 7)
            let isPinned = sqlite3_column_int(stmt, 8) == 1

            tabs.append(VaultTab(
                id: id,
                url: url,
                title: title,
                favicon: favicon,
                contentSnippet: snippet,
                spaceName: space,
                createdAt: createdAt,
                lastAccessedAt: lastAccessed,
                isPinned: isPinned,
                score: nil
            ))
        }

        return tabs
    }

    func searchTabs(query: String, limit: Int = 40) -> [VaultTab] {
        let queryVector = computeEmbedding(text: query)

        // 1. Gather FTS5 Matches
        var ftsIds = Set<String>()
        var ftsScores: [String: Double] = [:]

        // Sanitize query for FTS5 (strip punctuation that could cause syntax errors)
        let cleanedQuery = query.components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: " ")

        if !cleanedQuery.isEmpty {
            let ftsSQL = "SELECT id, rank FROM vault_fts WHERE vault_fts MATCH ? ORDER BY rank LIMIT 80;"
            var stmt: OpaquePointer?
            if sqlite3_prepare_v2(db, ftsSQL, -1, &stmt, nil) == SQLITE_OK {
                let matchExpr = cleanedQuery.split(separator: " ").map { "\($0)*" }.joined(separator: " OR ")
                sqlite3_bind_text(stmt, 1, (matchExpr as NSString).utf8String, -1, nil)
                while sqlite3_step(stmt) == SQLITE_ROW {
                    let id = String(cString: sqlite3_column_text(stmt, 0))
                    let rank = sqlite3_column_double(stmt, 1)
                    ftsIds.insert(id)
                    // FTS5 rank is negative (lower = better match), invert to positive score
                    ftsScores[id] = max(0.1, -rank)
                }
                sqlite3_finalize(stmt)
            }
        }

        // 2. Load candidate tabs with vectors
        let selectSQL = "SELECT id, url, title, favicon, content_snippet, space_name, created_at, last_accessed_at, is_pinned, embedding FROM vault_tabs;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, selectSQL, -1, &stmt, nil) == SQLITE_OK else {
            return []
        }
        defer { sqlite3_finalize(stmt) }

        var results: [VaultTab] = []

        while sqlite3_step(stmt) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(stmt, 0))
            let url = String(cString: sqlite3_column_text(stmt, 1))
            let title = String(cString: sqlite3_column_text(stmt, 2))
            
            var favicon: String? = nil
            if let favCStr = sqlite3_column_text(stmt, 3) {
                favicon = String(cString: favCStr)
            }

            var snippet: String? = nil
            if let snipCStr = sqlite3_column_text(stmt, 4) {
                snippet = String(cString: snipCStr)
            }

            var space: String? = nil
            if let spaceCStr = sqlite3_column_text(stmt, 5) {
                space = String(cString: spaceCStr)
            }

            let createdAt = sqlite3_column_int64(stmt, 6)
            let lastAccessed = sqlite3_column_int64(stmt, 7)
            let isPinned = sqlite3_column_int(stmt, 8) == 1

            // Compute semantic similarity if vector exists
            var semanticScore: Double = 0.0
            if let qVec = queryVector, let blobPtr = sqlite3_column_blob(stmt, 9) {
                let blobBytes = sqlite3_column_bytes(stmt, 9)
                let floatCount = Int(blobBytes) / MemoryLayout<Float>.size
                let buffer = blobPtr.bindMemory(to: Float.self, capacity: floatCount)
                let tabVec = Array(UnsafeBufferPointer(start: buffer, count: floatCount))
                
                let sim = Double(cosineSimilarity(qVec, tabVec))
                semanticScore = max(0.0, sim)
            }

            let ftsScore = ftsScores[id] ?? 0.0

            // Hybrid scoring: blend full-text keyword match with semantic vector similarity
            // If neither matches well, filter out unless candidate query is empty
            var finalScore: Double = 0.0
            if ftsScore > 0 {
                finalScore += ftsScore * 1.5
            }
            if semanticScore > 0.18 {
                finalScore += semanticScore * 2.5
            }

            if finalScore > 0.20 || cleanedQuery.isEmpty {
                results.append(VaultTab(
                    id: id,
                    url: url,
                    title: title,
                    favicon: favicon,
                    contentSnippet: snippet,
                    spaceName: space,
                    createdAt: createdAt,
                    lastAccessedAt: lastAccessed,
                    isPinned: isPinned,
                    score: finalScore
                ))
            }
        }

        // Sort descending by score, or by recency if empty query
        if !cleanedQuery.isEmpty {
            results.sort { ($0.score ?? 0) > ($1.score ?? 0) }
        } else {
            results.sort { $0.lastAccessedAt > $1.lastAccessedAt }
        }

        return Array(results.prefix(limit))
    }

    func deleteTab(id: String) -> Bool {
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "DELETE FROM vault_tabs WHERE id = ?;", -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, (id as NSString).utf8String, -1, nil)
            sqlite3_step(stmt)
            sqlite3_finalize(stmt)
        }
        if sqlite3_prepare_v2(db, "DELETE FROM vault_fts WHERE id = ?;", -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, (id as NSString).utf8String, -1, nil)
            sqlite3_step(stmt)
            sqlite3_finalize(stmt)
        }
        return true
    }

    func getStats(dbPath: String) -> [String: Any] {
        var count: Int = 0
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM vault_tabs;", -1, &stmt, nil) == SQLITE_OK {
            if sqlite3_step(stmt) == SQLITE_ROW {
                count = Int(sqlite3_column_int(stmt, 0))
            }
            sqlite3_finalize(stmt)
        }

        let attr = try? FileManager.default.attributesOfItem(atPath: dbPath)
        let fileSize = (attr?[.size] as? Int64) ?? 0

        // Estimate RAM saved: average unmounted webview consumes ~250MB
        let estimatedMbSaved = count * 220

        return [
            "vaultedCount": count,
            "dbSizeBytes": fileSize,
            "estimatedMbSaved": estimatedMbSaved
        ]
    }
}

// MARK: - CLI Entrypoint

func defaultDBPath() -> String {
    let home = FileManager.default.homeDirectoryForCurrentUser.path
    return "\(home)/.lor/vault.db"
}

let args = CommandLine.arguments

var dbPath = defaultDBPath()
var command = "help"
var queryArg = ""
var limitArg = 40

var i = 1
while i < args.count {
    let arg = args[i]
    if arg == "--db" && i + 1 < args.count {
        dbPath = args[i + 1]
        i += 2
        continue
    } else if arg == "--limit" && i + 1 < args.count {
        limitArg = Int(args[i + 1]) ?? 40
        i += 2
        continue
    } else if !arg.hasPrefix("--") && command == "help" {
        command = arg
    } else if command == "search" || command == "delete" {
        queryArg = arg
    }
    i += 1
}

let vault = LorVaultDB(path: dbPath)

switch command {
case "index":
    // Read JSON payload from STDIN
    let stdinData = FileHandle.standardInput.readDataToEndOfFile()
    if let payload = try? JSONDecoder().decode(IndexPayload.self, from: stdinData) {
        let ok = vault.indexTab(payload: payload)
        print("{\"success\": \(ok), \"id\": \"\(payload.id)\"}")
    } else {
        fputs("Failed to parse IndexPayload from stdin\n", stderr)
        exit(1)
    }

case "list":
    let tabs = vault.listTabs(limit: limitArg)
    if let data = try? JSONEncoder().encode(tabs), let jsonStr = String(data: data, encoding: .utf8) {
        print(jsonStr)
    } else {
        print("[]")
    }

case "search":
    let results = vault.searchTabs(query: queryArg, limit: limitArg)
    if let data = try? JSONEncoder().encode(results), let jsonStr = String(data: data, encoding: .utf8) {
        print(jsonStr)
    } else {
        print("[]")
    }

case "delete":
    let ok = vault.deleteTab(id: queryArg)
    print("{\"success\": \(ok)}")

case "stats":
    let stats = vault.getStats(dbPath: dbPath)
    if let data = try? JSONSerialization.data(withJSONObject: stats), let jsonStr = String(data: data, encoding: .utf8) {
        print(jsonStr)
    } else {
        print("{}")
    }

default:
    print("""
    Lor Tab Vault CLI
    Usage:
      lor-vault index [--db <path>] < json_stdin
      lor-vault search <query> [--db <path>] [--limit <n>]
      lor-vault list [--db <path>] [--limit <n>]
      lor-vault delete <tab_id> [--db <path>]
      lor-vault stats [--db <path>]
    """)
}
