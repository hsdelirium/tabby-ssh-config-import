import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { SSHConfigImportComponent } from './importComponent'

@Injectable()
export class SSHConfigImportSettingsTabProvider extends SettingsTabProvider {
    id = 'ssh-config-import'
    icon = 'fas fa-file-import'
    title = 'SSH Config Import'

    getComponentType (): any {
        return SSHConfigImportComponent
    }
}
