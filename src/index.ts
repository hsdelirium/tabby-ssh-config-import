import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SettingsTabProvider } from 'tabby-settings'

import { SSHConfigImportComponent } from './importComponent'
import { SSHConfigImportSettingsTabProvider } from './settingsTab'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
    ],
    providers: [
        {
            provide: SettingsTabProvider,
            useClass: SSHConfigImportSettingsTabProvider,
            multi: true,
        },
    ],
    declarations: [
        SSHConfigImportComponent,
    ],
})
export default class SSHConfigImportModule {}
