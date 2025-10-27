import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-rutina-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-rutina-dialog.component.html',
  styleUrls: ['./ver-rutina-dialog.component.css']
})
export class VerRutinaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VerRutinaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  close() {
    this.dialogRef.close();
  }
}
