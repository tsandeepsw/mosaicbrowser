import { session, Session } from 'electron';
import { DownloadManager } from './DownloadManager';

export class SessionManager {
  public static getIsolatedSession(partitionId: string): Session {
    const partition = partitionId.startsWith('persist:') ? partitionId : `persist:${partitionId}`;
    const isolatedSession = session.fromPartition(partition);
    
    if (isolatedSession.listeners('will-download').length === 0) {
      isolatedSession.on('will-download', (event, item) => {
        DownloadManager.handleWillDownload(event, item);
      });
    }

    return isolatedSession;
  }
}
