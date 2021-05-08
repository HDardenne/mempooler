import { EventType } from 'electron/eventType';
import { Observable } from 'rxjs';

export class Utils {
  static request<T>(electron: any, event: string, reqArg: any): Observable<T> {
    electron.ipcRenderer.send(event + EventType.Request, reqArg);
    return new Observable<any>(s => {
      electron.ipcRenderer.once(
        event + EventType.Response,
        (event: any, data: any) => {
          s.next(data);
          s.complete();
        }
      );
    });
  }
}
