import { CacheInspectorService } from './shared/services/cache-inspector.service';
import { Component, effect, OnInit, inject } from '@angular/core';
import { UpdateService } from './shared/services/update.service';
import { ConnectivityService } from './shared/services/connectivity.service';
import { NotificationService } from './shared/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  private updateService = inject(UpdateService);
  private notificationService = inject(NotificationService);
  private connectivityService = inject(ConnectivityService);
  private cacheInspector = inject(CacheInspectorService);

  constructor() {
    effect(() => {
      if (!this.connectivityService.isOnline()) {
        this.notificationService.showNotification('Notificação', {body: 'Você está offline :('});
        return;
      }

      this.notificationService.showNotification('Notificação', {body: 'Você está online :)'});
    });
  }

  async ngOnInit() {
    const hasUpdate = await this.updateService.checkForUpdate();
    if (hasUpdate) {
      console.log('Atualização encontrada durante a inicialização');
    }

    this.cacheInspector.checkAssetsCache();
  }
}
