import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-dialog-pagar-membresia',
    imports: [CommonModule, FormsModule],
    templateUrl: './dialog-pagar-membresia.component.html'
})
export class DialogPagarMembresiaComponent {

    monto = 0;
    metodo = '';
    transferOK = false;

    constructor(
        private dialogRef: MatDialogRef<DialogPagarMembresiaComponent>,
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
            monto: this.monto,
            metodo: this.metodo
        });
    }
}
