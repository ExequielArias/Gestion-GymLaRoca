import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-dialog-extender-membresia',
    imports: [CommonModule, FormsModule],
    templateUrl: './dialog-extender-membresia.component.html'
})
export class DialogExtenderMembresiaComponent {

    precioMes = 0;
    meses = 1;
    metodo = '';
    transferOK = false;

    constructor(
        private dialogRef: MatDialogRef<DialogExtenderMembresiaComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onCancel() {
        this.dialogRef.close(null);
    }

    procesarTransferencia() {
        this.transferOK = true;
    }

    onSave() {
        this.dialogRef.close({
            meses: this.meses,
            montoTotal: this.precioMes * this.meses,
            metodo: this.metodo
        });
    }
}
