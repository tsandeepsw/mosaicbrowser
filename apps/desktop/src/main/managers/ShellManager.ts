import { shell } from 'electron';
import { NavigationManager } from './NavigationManager';

export class ShellManager {
  public static async openExternal(urlStr: string): Promise<boolean> {
    if (!NavigationManager.isValidUrl(urlStr)) {
      console.warn(`Blocked attempt to open external unsafe URL: ${urlStr}`);
      return false;
    }
    
    // Explicitly parse URL to verify again to prevent argument injection
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        console.warn(`Protocol not allowed for external open: ${parsedUrl.protocol}`);
        return false;
      }
      
      // Ensure no sneaky arguments are passed by just passing the reconstructed safe URL string
      await shell.openExternal(parsedUrl.toString());
      return true;
    } catch {
      return false;
    }
  }
}
