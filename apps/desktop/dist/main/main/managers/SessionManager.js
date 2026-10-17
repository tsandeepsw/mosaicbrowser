"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const electron_1 = require("electron");
const DownloadManager_1 = require("./DownloadManager");
class SessionManager {
    static getIsolatedSession(partitionId) {
        const partition = partitionId.startsWith('persist:') ? partitionId : `persist:${partitionId}`;
        const isolatedSession = electron_1.session.fromPartition(partition);
        if (isolatedSession.listeners('will-download').length === 0) {
            isolatedSession.on('will-download', (event, item) => {
                DownloadManager_1.DownloadManager.handleWillDownload(event, item);
            });
        }
        return isolatedSession;
    }
}
exports.SessionManager = SessionManager;
