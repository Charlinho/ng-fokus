import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter, interval, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(private swUpdate: SwUpdate) {
    this.initializeUpdateChecks();
  }

  private initializeUpdateChecks(): void {
    if (!this.swUpdate.isEnabled) return;

    interval(60 * 1000).subscribe(() => this.checkForUpdate());

    this.swUpdate.versionUpdates
      .pipe(
        tap(event => console.log(`Evento de atualização: ${event.type}`)),
        filter(event => event.type === 'VERSION_READY')
      )
      .subscribe(() => this.promptUserToUpdate());

    this.swUpdate.unrecoverable.subscribe(() => {
      alert('Um erro ocorreu. O aplicativo será recarregado.');
      window.location.reload();
    });
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) return false;

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return false;
    }
  }

  private promptUserToUpdate(): void {
    if (confirm('Nova versão disponível. Deseja atualizar agora?')) {
      this.swUpdate.activateUpdate()
        .then(() => window.location.reload())
        .catch(error => console.error('Erro ao ativar atualização:', error));
    }
  }
}
