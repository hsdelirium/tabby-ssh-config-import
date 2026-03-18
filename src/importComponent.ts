import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ProfilesService, ConfigService } from 'tabby-core'
import { FA_ICONS } from './faIcons'

interface HostRow {
    id: string
    hostname: string   // SSH Host alias (display name)
    ip: string         // SSH HostName (actual host)
    selected: boolean
    group: string      // group UUID or ''
    icon: string       // icon name without prefix, e.g. 'desktop'
    color: string      // CSS color or ''
    originalProfile: any
}

interface GroupOption {
    id: string
    name: string
}

const PRESET_ICONS = ['server', 'database', 'vault', 'cloud', 'star']

const PRESET_COLORS: { label: string, value: string }[] = [
    { label: 'Red / Красный',       value: '#e74c3c' },
    { label: 'Orange / Оранжевый',  value: '#e67e22' },
    { label: 'Yellow / Жёлтый',     value: '#f1c40f' },
    { label: 'Green / Зелёный',     value: '#2ecc71' },
    { label: 'Blue / Синий',        value: '#3498db' },
    { label: 'Indigo / Индиго',     value: '#4b0082' },
    { label: 'Violet / Фиолетовый', value: '#9b59b6' },
    { label: 'Black / Чёрный',      value: '#000000' },
    { label: 'White / Белый',       value: '#ffffff' },
]

type Lang = 'en' | 'ru'
const I18N: Record<string, Record<Lang, string>> = {
    loading:      { en: 'Loading profiles…',                                         ru: 'Загрузка профилей…' },
    noHosts:      { en: 'No new hosts to import.',                                   ru: 'Нет новых хостов для импорта.' },
    allImported:  { en: 'All hosts from ~/.ssh/config are already in Tabby.',        ru: 'Все хосты из ~/.ssh/config уже добавлены в профили Tabby.' },
    deselectAll:  { en: 'Deselect all',     ru: 'Снять выделение' },
    selectAll:    { en: 'Select all',       ru: 'Выделить все' },
    colGroup:     { en: 'Group',            ru: 'Группа' },
    colIcon:      { en: 'Icon',             ru: 'Иконка' },
    colColor:     { en: 'Color',            ru: 'Цвет' },
    filter:       { en: 'Filter…',          ru: 'Фильтр…' },
    forAll:       { en: 'for all',          ru: 'для всех' },
    noGroup:      { en: '— no group —',     ru: '— без группы —' },
    addNew:       { en: '+ Add new…',       ru: '+ Добавить новую…' },
    addSelected:  { en: 'Add selected',     ru: 'Добавить выбранные' },
    addAll:       { en: 'Add all',          ru: 'Добавить все' },
    recentIcons:  { en: 'Recently used:',   ru: 'Недавно использованные:' },
    searchIcon:   { en: 'Search icon…',     ru: 'Поиск иконки…' },
    allIcons:     { en: '🔍 All icons',      ru: '🔍 Все иконки' },
    clear:        { en: 'Clear',            ru: 'Очистить' },
    searchIcons:  { en: 'Search icons…',    ru: 'Поиск иконок…' },
    found:        { en: 'Found',            ru: 'Найдено' },
    of:           { en: 'of',              ru: 'из' },
    ok:           { en: 'OK',              ru: 'OK' },
    cancel:       { en: 'Cancel',           ru: 'Отмена' },
    newGroupName: { en: 'New group name',   ru: 'Название новой группы' },
    selectGroup:  { en: '— select group —', ru: '— выберите группу —' },
}

@Component({
    standalone: false,
    template: `
        <div class="sci-root">

            <div *ngIf="successMessage" class="sci-alert-success">
                <i class="fas fa-check-circle"></i> {{ successMessage }}
            </div>

            <div *ngIf="loading" class="sci-empty">
                <i class="fas fa-spinner fa-spin"></i> {{ t('loading') }}
            </div>

            <div *ngIf="!loading && rows.length === 0" class="sci-empty">
                <i class="fas fa-check-circle" style="font-size:2rem; color:#2ecc71;"></i>
                <div style="margin-top:8px;">{{ t('noHosts') }}</div>
                <div class="sci-hint">{{ t('allImported') }}</div>
            </div>

            <ng-container *ngIf="!loading && rows.length > 0">

                <!-- Top controls -->
                <div class="sci-top-bar">
                    <button class="sci-btn sci-btn-secondary" (click)="deselectAll()">
                        {{ t('deselectAll') }}
                    </button>
                    <button class="sci-btn sci-btn-secondary" (click)="selectAll()">
                        {{ t('selectAll') }}
                    </button>
                </div>

                <!-- Scrollable table -->
                <div class="sci-table-wrap">
                    <table class="sci-table">
                        <thead>
                            <tr>
                                <th class="sci-th-check"></th>
                                <th class="sci-th-hostname">Name</th>
                                <th class="sci-th-ip">IP / Host</th>
                                <th class="sci-th-group">{{ t('colGroup') }}</th>
                                <th class="sci-th-icon">{{ t('colIcon') }}</th>
                                <th class="sci-th-color">{{ t('colColor') }}</th>
                            </tr>
                            <tr class="sci-controls-row">
                                <td></td>
                                <td><input class="sci-input" [(ngModel)]="filterName" [placeholder]="t('filter')"></td>
                                <td><input class="sci-input" [(ngModel)]="filterIp" [placeholder]="t('filter')"></td>
                                <td>
                                    <button class="sci-icon-btn" (click)="openBulkGroupPicker($event)">
                                        <i class="fas fa-layer-group"></i>
                                        <span class="sci-icon-label">{{ t('forAll') }}</span>
                                    </button>
                                </td>
                                <td>
                                    <button class="sci-icon-btn" (click)="openBulkIconPicker($event)">
                                        <i class="fas fa-icons"></i>
                                        <span class="sci-icon-label">{{ t('forAll') }}</span>
                                    </button>
                                </td>
                                <td>
                                    <button class="sci-color-btn" (click)="openBulkColorPicker($event)">
                                        <span class="sci-color-dot" style="background:#555; border-color:#666;"></span>
                                        <span class="sci-color-label">{{ t('forAll') }}</span>
                                    </button>
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let row of filteredRows" [class.sci-row-selected]="row.selected">
                                <td class="sci-td-check">
                                    <input type="checkbox" [(ngModel)]="row.selected">
                                </td>
                                <td class="sci-td-input">
                                    <input class="sci-input" [(ngModel)]="row.hostname" placeholder="name">
                                </td>
                                <td class="sci-td-input">
                                    <input class="sci-input" [(ngModel)]="row.ip" placeholder="ip/host">
                                </td>

                                <!-- Group dropdown -->
                                <td class="sci-td-group">
                                    <select class="sci-select"
                                            [ngModel]="row.group"
                                            (ngModelChange)="onGroupChange(row, $event)">
                                        <option value="">{{ t('noGroup') }}</option>
                                        <option value="__add_new__">{{ t('addNew') }}</option>
                                        <option *ngFor="let g of groups" [value]="g.id">{{ g.name }}</option>
                                    </select>
                                </td>

                                <!-- Icon picker button -->
                                <td class="sci-td-icon">
                                    <button class="sci-icon-btn" (click)="openIconPicker(row, $event)">
                                        <i *ngIf="row.icon" [class]="'fas fa-' + row.icon"></i>
                                        <span class="sci-icon-label">{{ row.icon || '—' }}</span>
                                    </button>
                                </td>

                                <!-- Color picker button -->
                                <td class="sci-td-color">
                                    <button class="sci-color-btn" (click)="openColorPicker(row, $event)">
                                        <span class="sci-color-dot"
                                              [style.background]="row.color || '#444'"
                                              [style.border-color]="row.color ? '#888' : '#555'">
                                        </span>
                                        <span class="sci-color-label">{{ row.color || '—' }}</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Bottom action bar -->
                <div class="sci-action-bar">
                    <button class="sci-btn sci-btn-primary"
                            [disabled]="selectedCount === 0"
                            (click)="addSelected()">
                        <i class="fas fa-check"></i>
                        {{ t('addSelected') }} ({{ selectedCount }})
                    </button>
                    <button class="sci-btn sci-btn-success" (click)="addAll()">
                        <i class="fas fa-check-double"></i>
                        {{ t('addAll') }} ({{ rows.length }})
                    </button>
                </div>

            </ng-container>
        </div>
    `,
    styles: [`
        .sci-root {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 120px);
            margin: 0 -30px;
            padding: 16px 8px;
            box-sizing: border-box;
            font-size: 13px;
        }

        .sci-alert-success {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            background: rgba(20, 40, 25, 0.97);
            border: 1px solid #2ecc71;
            border-radius: 6px;
            padding: 10px 16px;
            color: #2ecc71;
            font-size: 13px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            pointer-events: none;
        }

        .sci-empty {
            text-align: center;
            color: #888;
            padding: 48px 16px;
            font-size: 14px;
        }
        .sci-hint {
            font-size: 12px;
            color: #666;
            margin-top: 6px;
        }

        .sci-top-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            flex-shrink: 0;
        }
        .sci-count-label {
            color: #888;
            font-size: 12px;
            margin-left: 4px;
        }

        /* Buttons */
        .sci-btn {
            padding: 5px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: opacity 0.15s;
        }
        .sci-btn:disabled { opacity: 0.4; cursor: default; }
        .sci-btn-secondary { background: #3a3a4a; color: #ccc; }
        .sci-btn-secondary:hover:not(:disabled) { background: #4a4a5a; }
        .sci-btn-primary { background: #3498db; color: #fff; }
        .sci-btn-primary:hover:not(:disabled) { background: #2980b9; }
        .sci-btn-success { background: #2ecc71; color: #fff; }
        .sci-btn-success:hover:not(:disabled) { background: #27ae60; }

        .sci-controls-row td {
            padding: 5px 10px;
            background: #181828;
            border-bottom: 2px solid #333;
        }

        /* Scrollable table */
        .sci-table-wrap {
            overflow-y: auto;
            overflow-x: auto;
            flex: 1;
            border: 1px solid #333;
            border-radius: 6px;
        }

        .sci-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            table-layout: fixed;
        }
        .sci-table thead {
            position: sticky;
            top: 0;
            background: #1e1e2e;
            z-index: 1;
        }
        .sci-table th {
            padding: 8px 10px;
            text-align: left;
            color: #888;
            font-weight: 600;
            border-bottom: 1px solid #333;
            white-space: nowrap;
        }
        .sci-table td {
            padding: 5px 10px;
            border-bottom: 1px solid #2a2a3a;
            vertical-align: middle;
        }
        .sci-row-selected td {
            background: rgba(52, 152, 219, 0.06);
        }

        .sci-th-check { width: 32px; }
        .sci-th-hostname { width: 26%; }
        .sci-th-ip { width: 22%; }
        .sci-th-group { width: 22%; }
        .sci-th-icon { width: 15%; }
        .sci-th-color { width: 15%; }

        .sci-td-check { text-align: center; }
        input[type="checkbox"] { cursor: pointer; width: 14px; height: 14px; }

        .sci-input {
            width: 100%;
            box-sizing: border-box;
            padding: 4px 7px;
            background: #1a1a2a;
            border: 1px solid #3a3a4a;
            border-radius: 4px;
            color: #cdd6f4;
            font-size: 12px;
            outline: none;
        }
        .sci-input:focus { border-color: #5c8fb4; }

        .sci-select {
            width: 100%;
            padding: 4px 6px;
            background: #1a1a2a;
            border: 1px solid #3a3a4a;
            border-radius: 4px;
            color: #cdd6f4;
            font-size: 12px;
            outline: none;
            cursor: pointer;
        }
        .sci-select:focus { border-color: #5c8fb4; }

        .sci-icon-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            background: #2a2a3a;
            border: 1px solid #3a3a4a;
            border-radius: 4px;
            color: #cdd6f4;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
            width: 100%;
            box-sizing: border-box;
        }
        .sci-icon-btn:hover { border-color: #5c8fb4; background: #32324a; }
        .sci-icon-label {
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex: 1;
        }

        .sci-color-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: #2a2a3a;
            border: 1px solid #3a3a4a;
            border-radius: 4px;
            color: #cdd6f4;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
            width: 100%;
            box-sizing: border-box;
        }
        .sci-color-btn:hover { border-color: #5c8fb4; background: #32324a; }
        .sci-color-dot {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid #555;
            flex-shrink: 0;
        }
        .sci-color-label {
            font-size: 11px;
            opacity: 0.8;
        }

        .sci-action-bar {
            display: flex;
            gap: 10px;
            padding-top: 12px;
            border-top: 1px solid #333;
            flex-shrink: 0;
            margin-top: 4px;
        }
    `],
})
export class SSHConfigImportComponent implements OnInit, OnDestroy {
    rows: HostRow[] = []
    groups: GroupOption[] = []
    loading = true
    successMessage = ''
    filterName = ''
    filterIp = ''

    get filteredRows (): HostRow[] {
        const n = this.filterName.toLowerCase()
        const ip = this.filterIp.toLowerCase()
        return this.rows.filter(r =>
            (!n || r.hostname.toLowerCase().includes(n)) &&
            (!ip || r.ip.toLowerCase().includes(ip)),
        )
    }

    private activeOverlay: HTMLElement | null = null
    private successTimer: any = null

    constructor (
        private profilesService: ProfilesService,
        private config: ConfigService,
        private cdr: ChangeDetectorRef,
    ) {}

    async ngOnInit () {
        await this.loadRows()
        this.loadGroups()
        this.loading = false
        this.cdr.detectChanges()
    }

    ngOnDestroy () {
        this.closeOverlay()
        if (this.successTimer) {
            clearTimeout(this.successTimer)
        }
    }

    get lang (): Lang {
        const l: string = (this.config.store as any).language || navigator.language || ''
        return l.startsWith('ru') ? 'ru' : 'en'
    }

    t (key: string): string {
        return I18N[key]?.[this.lang] ?? key
    }

    get selectedCount (): number {
        return this.rows.filter(r => r.selected).length
    }

    // ─── Data Loading ─────────────────────────────────────────────────────────

    get defaultIcon (): string {
        const raw = (this.config.store as any).profileDefaults?.['ssh']?.icon ?? ''
        return raw.startsWith('fas fa-') ? raw.slice(7) : raw
    }

    async loadRows () {
        const allProfiles = await this.profilesService.getProfiles({ includeBuiltin: true })

        // Collect hosts already saved as non-builtin SSH profiles
        const savedHosts = new Set<string>(
            allProfiles
                .filter(p => !p.isBuiltin && (p as any).type === 'ssh')
                .map(p => (p as any).options?.host as string)
                .filter(Boolean),
        )

        // Get only the SSH config imported builtin profiles
        const importedProfiles = allProfiles.filter(
            p => p.isBuiltin && (p as any).group === 'Imported from .ssh/config',
        )

        // Exclude already-saved hosts
        this.rows = importedProfiles
            .filter(p => !savedHosts.has((p as any).options?.host))
            .map(p => ({
                id: p.id!,
                hostname: ((p.name ?? '') as string).replace(/\s*\(\.ssh\/config\)\s*$/, '').trim(),
                ip: (p as any).options?.host ?? '',
                selected: false,
                group: '',
                icon: this.defaultIcon,
                color: '',
                originalProfile: p,
            }))
    }

    loadGroups () {
        this.groups = this.profilesService.getSyncProfileGroups()
            .filter(g => g.id && g.name)
            .map(g => ({ id: g.id!, name: g.name! }))
    }

    // ─── Selection ────────────────────────────────────────────────────────────

    selectAll () { this.rows.forEach(r => r.selected = true) }
    deselectAll () { this.rows.forEach(r => r.selected = false) }

    // ─── Group dropdown ───────────────────────────────────────────────────────

    openBulkGroupPicker (event: MouseEvent) {
        this.closeOverlay()
        const btn = event.currentTarget as HTMLElement
        const rect = btn.getBoundingClientRect()

        const overlay = document.createElement('div')
        this.activeOverlay = overlay
        overlay.style.cssText = `
            position: fixed; z-index: 9999;
            top: ${Math.min(rect.bottom + 4, window.innerHeight - 180)}px;
            left: ${Math.min(rect.left, window.innerWidth - 240)}px;
            background: #1e1e2e; border: 1px solid #444; border-radius: 8px;
            padding: 10px; width: 230px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.6);
        `

        const select = document.createElement('select')
        Object.assign(select.style, {
            width: '100%', padding: '5px 7px', background: '#0d0d1a',
            border: '1px solid #5c8fb4', borderRadius: '4px', color: '#cdd6f4',
            fontSize: '12px', outline: 'none', marginBottom: '8px', cursor: 'pointer',
        })

        const addOpt = (value: string, text: string) => {
            const o = document.createElement('option')
            o.value = value
            o.textContent = text
            select.append(o)
        }
        addOpt('', this.t('noGroup'))
        addOpt('__add_new__', this.t('addNew'))
        for (const g of this.groups) { addOpt(g.id, g.name) }

        overlay.append(select)

        const btnRow = document.createElement('div')
        btnRow.style.cssText = 'display:flex; gap:6px;'

        const okBtn = document.createElement('button')
        okBtn.textContent = 'OK'
        Object.assign(okBtn.style, {
            flex: '1', padding: '5px', background: '#5c8fb4', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
        })
        okBtn.addEventListener('click', async () => {
            const val = select.value
            if (val === '__add_new__') {
                this.closeOverlay()
                const name = await this.promptNewGroupName()
                if (name) {
                    await this.profilesService.newProfileGroup({ id: '', name })
                    this.config.save()
                    this.loadGroups()
                    const created = this.groups.find(g => g.name === name)
                    for (const r of this.rows) { r.group = created?.id ?? '' }
                    this.cdr.detectChanges()
                }
            } else {
                for (const r of this.rows) { r.group = val }
                this.closeOverlay()
                this.cdr.detectChanges()
            }
        })

        const clearBtn = document.createElement('button')
        clearBtn.textContent = this.t('clear')
        Object.assign(clearBtn.style, {
            flex: '1', padding: '5px', background: '#2a2a3a', color: '#aaa',
            border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
        })
        clearBtn.addEventListener('click', () => {
            for (const r of this.rows) { r.group = '' }
            this.closeOverlay()
            this.cdr.detectChanges()
        })

        btnRow.append(okBtn, clearBtn)
        overlay.append(btnRow)

        document.body.append(overlay)
        setTimeout(() => {
            document.addEventListener('click', this.outsideClickHandler, true)
        }, 0)
    }

    async onGroupChange (row: HostRow, value: string) {
        if (value !== '__add_new__') {
            row.group = value
            return
        }

        // Revert select visual while dialog is open
        row.group = ''
        this.cdr.detectChanges()

        const name = await this.promptNewGroupName()
        if (name) {
            await this.profilesService.newProfileGroup({ id: '', name })
            this.config.save()
            this.loadGroups()
            const created = this.groups.find(g => g.name === name)
            row.group = created?.id ?? ''
        }

        this.cdr.detectChanges()
    }

    // ─── Import ───────────────────────────────────────────────────────────────

    async addSelected () {
        await this.importRows(this.rows.filter(r => r.selected))
    }

    async addAll () {
        await this.importRows([...this.rows])
    }

    async importRows (rows: HostRow[]) {
        if (!rows.length) { return }

        for (const row of rows) {
            const profile: any = {
                type: 'ssh',
                name: row.hostname || row.ip,
                group: row.group || undefined,
                icon: row.icon ? `fas fa-${row.icon}` : undefined,
                color: row.color || undefined,
                options: {
                    ...(row.originalProfile.options ?? {}),
                    host: row.ip,
                },
                weight: 0,
                isBuiltin: false,
                isTemplate: false,
                behaviorOnSessionEnd: 'auto',
            }
            await this.profilesService.newProfile(profile)
        }

        this.config.save()

        const count = rows.length
        const importedIds = new Set(rows.map(r => r.id))
        this.rows = this.rows.filter(r => !importedIds.has(r.id))

        if (this.successTimer) { clearTimeout(this.successTimer) }
        this.successMessage = this.lang === 'ru'
            ? `Успешно импортировано: ${count} профил${count === 1 ? 'ь' : count < 5 ? 'я' : 'ей'}`
            : `Successfully imported: ${count} profile${count === 1 ? '' : 's'}`
        this.successTimer = setTimeout(() => {
            this.successMessage = ''
            this.cdr.detectChanges()
        }, 5000)

        this.cdr.detectChanges()
    }

    // ─── Icon Picker ──────────────────────────────────────────────────────────

    openIconPicker (row: HostRow, event: MouseEvent) {
        this.openIconPickerForRows([row], event)
    }

    openBulkIconPicker (event: MouseEvent) {
        this.openIconPickerForRows(this.rows, event)
    }

    private openIconPickerForRows (targets: HostRow[], event: MouseEvent) {
        this.closeOverlay()
        const btn = event.currentTarget as HTMLElement
        const rect = btn.getBoundingClientRect()

        const applyIcon = (iconName: string) => {
            for (const r of targets) { r.icon = iconName }
            this.closeOverlay()
            this.cdr.detectChanges()
        }

        // Collect recently used icons: presets → row icons (non-default) → saved profiles
        const usedIconNames: string[] = [...PRESET_ICONS]
        const addIcon = (name: string) => {
            if (name && !usedIconNames.includes(name)) { usedIconNames.push(name) }
        }
        for (const r of this.rows) {
            if (r.icon && r.icon !== this.defaultIcon) { addIcon(r.icon) }
        }
        for (const p of (this.config.store.profiles as any[] ?? [])) {
            if (p.icon && typeof p.icon === 'string' && p.icon.startsWith('fas fa-')) {
                addIcon(p.icon.slice(7))
            }
        }
        const recentIcons = usedIconNames.slice(0, 15)

        const overlay = document.createElement('div')
        this.activeOverlay = overlay
        overlay.style.cssText = `
            position: fixed;
            z-index: 9999;
            top: ${Math.min(rect.bottom + 4, window.innerHeight - 220)}px;
            left: ${Math.min(rect.left, window.innerWidth - 260)}px;
            background: #1e1e2e;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 10px;
            width: 250px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.6);
        `

        // ─ Search input ─
        const searchRow = document.createElement('div')
        searchRow.style.marginBottom = '6px'
        const searchInput = document.createElement('input')
        searchInput.type = 'text'
        searchInput.placeholder = this.t('searchIcon')
        searchInput.value = targets.length === 1 ? targets[0].icon : ''
        Object.assign(searchInput.style, {
            width: '100%', boxSizing: 'border-box', padding: '5px 8px',
            background: '#0d0d1a', border: '1px solid #5c8fb4', borderRadius: '4px',
            color: '#cdd6f4', fontSize: '12px', outline: 'none',
        })
        searchRow.append(searchInput)
        overlay.append(searchRow)

        // ─ First-match preview ─
        const previewRow = document.createElement('div')
        previewRow.style.cssText = 'margin-bottom: 8px; min-height: 28px;'
        overlay.append(previewRow)

        const getFirstMatch = (q: string) =>
            q ? FA_ICONS.find(n => n.includes(q.toLowerCase())) ?? null : null

        const renderPreview = (q: string) => {
            previewRow.innerHTML = ''
            const match = getFirstMatch(q)
            if (!match) { return }
            const chip = this.makeIconChip(match, () => applyIcon(match))
            chip.style.display = 'inline-flex'
            previewRow.append(chip)
        }

        renderPreview(searchInput.value)
        searchInput.addEventListener('input', () => renderPreview(searchInput.value.trim()))

        // ─ Recent icons ─
        if (recentIcons.length > 0) {
            const label = document.createElement('div')
            label.textContent = this.t('recentIcons')
            label.style.cssText = 'font-size:10px; color:#666; margin-bottom:5px;'
            overlay.append(label)

            const grid = document.createElement('div')
            grid.style.cssText = 'display:flex; flex-wrap:wrap; gap:3px; margin-bottom:8px;'
            for (const iconName of recentIcons) {
                grid.append(this.makeIconChip(iconName, () => applyIcon(iconName)))
            }
            overlay.append(grid)
        }

        // ─ "Show all" + Clear buttons ─
        const btnRow = document.createElement('div')
        btnRow.style.cssText = 'display:flex; gap:5px;'

        const showAllBtn = document.createElement('button')
        showAllBtn.textContent = this.t('allIcons')
        Object.assign(showAllBtn.style, {
            padding: '5px 8px', background: '#2a2a3a',
            border: '1px solid #444', borderRadius: '4px', color: '#aaa',
            cursor: 'pointer', fontSize: '11px',
        })
        showAllBtn.addEventListener('click', () => {
            this.closeOverlay()
            this.openIconGallery(targets, searchInput.value.trim())
        })

        const clearBtn = document.createElement('button')
        clearBtn.textContent = this.t('clear')
        Object.assign(clearBtn.style, {
            padding: '5px 8px', background: '#2a2a3a', border: '1px solid #444',
            borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '11px',
        })
        clearBtn.addEventListener('click', () => applyIcon(''))

        btnRow.append(showAllBtn, clearBtn)
        overlay.append(btnRow)

        // ─ Event handlers ─
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const val = searchInput.value.trim()
                const match = getFirstMatch(val)
                if (match) { applyIcon(match) } else if (val) { applyIcon(val) } else { this.closeOverlay() }
            }
            if (e.key === 'Escape') { this.closeOverlay() }
        })

        document.body.append(overlay)
        setTimeout(() => {
            searchInput.focus()
            searchInput.select()
            document.addEventListener('click', this.outsideClickHandler, true)
        }, 0)
    }

    openIconGallery (targets: HostRow[], initialSearch = '') {
        const overlay = document.createElement('div')
        this.activeOverlay = overlay
        overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.75);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999;
        `

        const dialog = document.createElement('div')
        dialog.style.cssText = `
            background: #1e1e2e; border: 1px solid #444; border-radius: 10px;
            padding: 16px; width: 640px; max-width: 95vw;
            max-height: 85vh; display: flex; flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.7);
        `

        // ─ Header ─
        const header = document.createElement('div')
        header.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:12px;'

        const searchInput = document.createElement('input')
        searchInput.type = 'text'
        searchInput.placeholder = this.t('searchIcons')
        searchInput.value = initialSearch
        Object.assign(searchInput.style, {
            flex: '1', padding: '7px 10px', background: '#0d0d1a',
            border: '1px solid #5c8fb4', borderRadius: '5px',
            color: '#cdd6f4', fontSize: '13px', outline: 'none',
        })

        const closeBtn = document.createElement('button')
        closeBtn.textContent = '✕'
        Object.assign(closeBtn.style, {
            padding: '6px 12px', background: '#2a2a3a', border: '1px solid #444',
            borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '13px',
        })
        closeBtn.addEventListener('click', () => {
            overlay.remove()
            this.activeOverlay = null
        })

        header.append(searchInput, closeBtn)
        dialog.append(header)

        // ─ Counter ─
        const counter = document.createElement('div')
        counter.style.cssText = 'font-size:11px; color:#666; margin-bottom:8px;'
        dialog.append(counter)

        // ─ Icons grid ─
        const iconsWrap = document.createElement('div')
        iconsWrap.style.cssText = `
            display: flex; flex-wrap: wrap; gap: 4px;
            overflow-y: auto; flex: 1; align-content: flex-start;
        `
        dialog.append(iconsWrap)

        const renderIcons = (filter: string) => {
            const filtered = FA_ICONS.filter(n => !filter || n.includes(filter.toLowerCase()))
            counter.textContent = `${this.t('found')}: ${filtered.length} ${this.t('of')} ${FA_ICONS.length}`
            iconsWrap.innerHTML = ''
            for (const iconName of filtered) {
                const cell = document.createElement('div')
                cell.title = iconName
                cell.style.cssText = `
                    width: 64px; height: 64px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; cursor: pointer;
                    border-radius: 5px; color: #cdd6f4; padding: 4px;
                    transition: background 0.1s;
                `
                cell.innerHTML = `
                    <i class="fas fa-${iconName}" style="font-size:22px; margin-bottom:5px; pointer-events:none;"></i>
                    <span style="font-size:8.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                                 width:100%; text-align:center; pointer-events:none;">${iconName}</span>
                `
                cell.addEventListener('mouseenter', () => { cell.style.background = '#2a2a3a' })
                cell.addEventListener('mouseleave', () => { cell.style.background = '' })
                cell.addEventListener('click', () => {
                    for (const r of targets) { r.icon = iconName }
                    overlay.remove()
                    this.activeOverlay = null
                    this.cdr.detectChanges()
                })
                iconsWrap.append(cell)
            }
        }

        renderIcons(initialSearch)

        searchInput.addEventListener('input', () => renderIcons(searchInput.value))
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                overlay.remove()
                this.activeOverlay = null
            }
        })
        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                overlay.remove()
                this.activeOverlay = null
            }
        })

        overlay.append(dialog)
        document.body.append(overlay)
        setTimeout(() => searchInput.focus(), 50)
    }

    private makeIconChip (iconName: string, onClick: () => void): HTMLElement {
        const el = document.createElement('div')
        el.title = iconName
        el.style.cssText = `
            padding: 5px 8px; border-radius: 4px; cursor: pointer;
            background: #2a2a3a; border: 1px solid #3a3a4a;
            display: flex; align-items: center; gap: 5px;
            font-size: 11px; color: #cdd6f4; white-space: nowrap;
        `
        el.innerHTML = `<i class="fas fa-${iconName}" style="pointer-events:none;"></i>
                        <span style="pointer-events:none; max-width:60px; overflow:hidden; text-overflow:ellipsis;">${iconName}</span>`
        el.addEventListener('mouseenter', () => { el.style.background = '#3a3a4a' })
        el.addEventListener('mouseleave', () => { el.style.background = '#2a2a3a' })
        el.addEventListener('click', onClick)
        return el
    }

    // ─── Color Picker ─────────────────────────────────────────────────────────

    openBulkColorPicker (event: MouseEvent) {
        this.openColorPickerForRows(this.rows, event)
    }

    openColorPicker (row: HostRow, event: MouseEvent) {
        this.openColorPickerForRows([row], event)
    }

    private openColorPickerForRows (targets: HostRow[], event: MouseEvent) {
        this.closeOverlay()
        const btn = event.currentTarget as HTMLElement
        const rect = btn.getBoundingClientRect()

        const overlay = document.createElement('div')
        this.activeOverlay = overlay
        overlay.style.cssText = `
            position: fixed; z-index: 9999;
            top: ${Math.min(rect.bottom + 4, window.innerHeight - 180)}px;
            left: ${Math.min(rect.left, window.innerWidth - 230)}px;
            background: #1e1e2e; border: 1px solid #444; border-radius: 8px;
            padding: 10px; width: 220px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.6);
        `

        // ─ Colour swatches ─
        const swatchRow = document.createElement('div')
        swatchRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;'

        const applyColor = (color: string) => {
            for (const r of targets) { r.color = color }
            this.closeOverlay()
            this.cdr.detectChanges()
        }

        const currentColor = targets.length === 1 ? targets[0].color : ''

        const makeDot = (color: string, label: string, selected: boolean) => {
            const dot = document.createElement('div')
            dot.title = label
            dot.style.cssText = `
                width: 26px; height: 26px; border-radius: 50%;
                background: ${color};
                border: 2px solid ${selected ? '#5c8fb4' : '#3a3a4a'};
                cursor: pointer; position: relative;
                box-shadow: ${selected ? '0 0 0 2px #5c8fb480' : 'none'};
            `
            if (selected) {
                dot.innerHTML = `<i class="fas fa-check" style="
                    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                    font-size:10px; color:${color === '#ffffff' ? '#000' : '#fff'};
                    pointer-events:none;"></i>`
            }
            dot.addEventListener('click', () => applyColor(color))
            return dot
        }

        for (const c of PRESET_COLORS) {
            swatchRow.append(makeDot(c.value, c.label, currentColor === c.value))
        }

        // Custom colors from current rows (non-preset)
        const presetValues = new Set(PRESET_COLORS.map(c => c.value))
        const customColors: string[] = []
        for (const r of this.rows) {
            if (r.color && !presetValues.has(r.color) && !customColors.includes(r.color)) {
                customColors.push(r.color)
            }
        }
        if (customColors.length > 0) {
            for (const color of customColors) {
                swatchRow.append(makeDot(color, color, currentColor === color))
            }
        }

        overlay.append(swatchRow)

        // ─ Divider ─
        const div = document.createElement('div')
        div.style.cssText = 'height:1px; background:#333; margin-bottom:8px;'
        overlay.append(div)

        // ─ Hex input row ─
        const hexRow = document.createElement('div')
        hexRow.style.cssText = 'display:flex; gap:6px; align-items:center;'

        // Preview dot
        const previewDot = document.createElement('div')
        previewDot.style.cssText = `
            width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
            border: 1px solid #555; background: ${currentColor || 'transparent'};
        `

        const hexInput = document.createElement('input')
        hexInput.type = 'text'
        hexInput.placeholder = '#RRGGBB'
        hexInput.value = currentColor
        Object.assign(hexInput.style, {
            width: '62px', padding: '4px 7px', background: '#0d0d1a',
            border: '1px solid #3a3a4a', borderRadius: '4px',
            color: '#cdd6f4', fontSize: '12px', outline: 'none',
        })

        const isValidHex = (v: string) => /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)
        hexInput.addEventListener('input', () => {
            const raw = hexInput.value.trim()
            const color = raw.startsWith('#') ? raw : (raw ? `#${raw}` : '')
            previewDot.style.background = isValidHex(color) ? color : 'transparent'
        })

        const applyBtn = document.createElement('button')
        applyBtn.textContent = 'OK'
        Object.assign(applyBtn.style, {
            padding: '4px 8px', background: '#5c8fb4', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
        })

        const clearBtn = document.createElement('button')
        clearBtn.textContent = this.t('clear')
        Object.assign(clearBtn.style, {
            padding: '4px 7px', background: '#2a2a3a', color: '#aaa',
            border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
        })

        const applyHex = () => {
            const val = hexInput.value.trim()
            applyColor(val.startsWith('#') ? val : (val ? `#${val}` : ''))
        }

        applyBtn.addEventListener('click', applyHex)
        clearBtn.addEventListener('click', () => applyColor(''))
        hexInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { applyHex() }
            if (e.key === 'Escape') { this.closeOverlay() }
        })

        hexRow.append(previewDot, hexInput, applyBtn, clearBtn)
        overlay.append(hexRow)

        document.body.append(overlay)
        setTimeout(() => {
            document.addEventListener('click', this.outsideClickHandler, true)
        }, 0)
    }

    // ─── New Group Dialog ─────────────────────────────────────────────────────

    promptNewGroupName (): Promise<string | null> {
        return new Promise(resolve => {
            const overlay = document.createElement('div')
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999;
            `

            const dialog = document.createElement('div')
            dialog.style.cssText = `
                background: #1e1e2e; border: 1px solid #444; border-radius: 8px;
                padding: 20px; width: 320px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.7);
            `

            const input = document.createElement('input')
            input.type = 'text'
            input.placeholder = this.t('newGroupName')
            Object.assign(input.style, {
                display: 'block', width: '100%', boxSizing: 'border-box',
                padding: '8px 12px', marginBottom: '12px',
                background: '#0d0d1a', border: '1px solid #5c8fb4',
                borderRadius: '5px', color: '#cdd6f4', fontSize: '14px', outline: 'none',
            })

            const btnRow = document.createElement('div')
            btnRow.style.cssText = 'display:flex; justify-content:flex-end; gap:8px;'

            const cancelBtn = document.createElement('button')
            cancelBtn.textContent = this.t('cancel')
            Object.assign(cancelBtn.style, {
                padding: '6px 14px', background: '#2a2a3a', border: '1px solid #444',
                borderRadius: '4px', color: '#aaa', cursor: 'pointer', fontSize: '13px',
            })

            const okBtn = document.createElement('button')
            okBtn.textContent = 'OK'
            Object.assign(okBtn.style, {
                padding: '6px 14px', background: '#5c8fb4', border: 'none',
                borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px',
            })

            const close = (result: string | null) => {
                overlay.remove()
                resolve(result)
            }

            okBtn.addEventListener('click', () => close(input.value.trim() || null))
            cancelBtn.addEventListener('click', () => close(null))
            overlay.addEventListener('click', e => {
                if (e.target === overlay) { close(null) }
            })
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { close(input.value.trim() || null) }
                if (e.key === 'Escape') { close(null) }
            })

            btnRow.append(cancelBtn, okBtn)
            dialog.append(input, btnRow)
            overlay.append(dialog)
            document.body.append(overlay)
            setTimeout(() => input.focus(), 50)
        })
    }

    // ─── Overlay helpers ──────────────────────────────────────────────────────

    private outsideClickHandler = (e: MouseEvent) => {
        if (this.activeOverlay && !this.activeOverlay.contains(e.target as Node)) {
            this.closeOverlay()
        }
    }

    private closeOverlay () {
        if (this.activeOverlay) {
            this.activeOverlay.remove()
            this.activeOverlay = null
        }
        document.removeEventListener('click', this.outsideClickHandler, true)
    }
}
