import { OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProfilesService, ConfigService } from 'tabby-core';
interface HostRow {
    id: string;
    hostname: string;
    ip: string;
    selected: boolean;
    group: string;
    icon: string;
    color: string;
    originalProfile: any;
}
interface GroupOption {
    id: string;
    name: string;
}
type Lang = 'en' | 'ru';
export declare class SSHConfigImportComponent implements OnInit, OnDestroy {
    private profilesService;
    private config;
    private cdr;
    rows: HostRow[];
    groups: GroupOption[];
    loading: boolean;
    successMessage: string;
    filterName: string;
    filterIp: string;
    get filteredRows(): HostRow[];
    private activeOverlay;
    private successTimer;
    constructor(profilesService: ProfilesService, config: ConfigService, cdr: ChangeDetectorRef);
    ngOnInit(): Promise<void>;
    ngOnDestroy(): void;
    get lang(): Lang;
    t(key: string): string;
    get selectedCount(): number;
    get defaultIcon(): string;
    loadRows(): Promise<void>;
    loadGroups(): void;
    selectAll(): void;
    deselectAll(): void;
    openBulkGroupPicker(event: MouseEvent): void;
    onGroupChange(row: HostRow, value: string): Promise<void>;
    addSelected(): Promise<void>;
    addAll(): Promise<void>;
    importRows(rows: HostRow[]): Promise<void>;
    openIconPicker(row: HostRow, event: MouseEvent): void;
    openBulkIconPicker(event: MouseEvent): void;
    private openIconPickerForRows;
    openIconGallery(targets: HostRow[], initialSearch?: string): void;
    private makeIconChip;
    openBulkColorPicker(event: MouseEvent): void;
    openColorPicker(row: HostRow, event: MouseEvent): void;
    private openColorPickerForRows;
    promptNewGroupName(): Promise<string | null>;
    private outsideClickHandler;
    private closeOverlay;
}
export {};
