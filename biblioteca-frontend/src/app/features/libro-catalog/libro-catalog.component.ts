import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { LibroService } from 'src/app/services/libro.service';
import { Libro } from 'src/app/models/libro.model';

@Component({
  selector: 'app-libro-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    SkeletonModule,
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './libro-catalog.component.html',
  styleUrl: './libro-catalog.component.scss',
})
export class LibroCatalogComponent {
  private libroService = inject(LibroService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  libros: Libro[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';

  libroDialog: boolean = false;
  isEditing: boolean = false;
  libroActual: Libro = this.getEmptyBook();
  isSubmitted: boolean = false;

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading = true;
    setTimeout(() => {
      this.libroService.getAll(this.searchTerm).subscribe({
        next: (data) => {
          this.libros = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error de conexión',
          });
        },
      });
    }, 500);
  }

  onSearch() {
    this.loadBooks();
  }

  openNew() {
    this.libroActual = this.getEmptyBook();
    this.isEditing = false;
    this.libroDialog = true;
    this.isSubmitted = false;
  }

  editBook(libro: Libro) {
    this.libroActual = { ...libro };
    this.isEditing = true;
    this.libroDialog = true;
  }

  saveBook() {
    this.isSubmitted = true;

    // 1. Validaciones Frontend básicas
    if (
      !this.libroActual.titulo ||
      !this.libroActual.isbn ||
      !this.libroActual.autor
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Llena todos los campos obligatorios (*)',
      });
      return;
    }

    if (
      this.libroActual.anioPublicacion < 1000 ||
      this.libroActual.anioPublicacion > 2025
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Año inválido',
        detail: 'El año debe estar entre 1000 y 2025',
      });
      return;
    }

    // 2. Enviar al Backend
    const request = this.isEditing
      ? this.libroService.update(this.libroActual.id!, this.libroActual)
      : this.libroService.create(this.libroActual);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Libro guardado correctamente',
        });
        this.libroDialog = false;
        this.loadBooks();
      },
      error: (err) => {
        // MANEJO DE ERRORES DEL BACKEND
        console.error(err);

        if (err.status === 409) {
          // 409 Conflict (ISBN Duplicado)
          this.messageService.add({
            severity: 'error',
            summary: 'ISBN Duplicado',
            detail: 'Ya existe un libro registrado con ese ISBN.',
          });
        } else if (err.status === 400) {
          // 400 Bad Request (Validaciones Java)
          // Si el backend devuelve mapa de errores, podríamos mostrarlos
          this.messageService.add({
            severity: 'error',
            summary: 'Datos Inválidos',
            detail: 'Revisa el formato del ISBN (debe comenzar con ISBN-)',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error del Sistema',
            detail: 'No se pudo guardar el libro.',
          });
        }
      },
    });
  }

  deleteBook(libro: Libro) {
    this.confirmationService.confirm({
      message: `¿Eliminar "${libro.titulo}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.libroService.delete(libro.id!).subscribe(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Eliminado',
          });
          this.loadBooks();
        });
      },
    });
  }

  toggleLoan(libro: Libro) {
    // Si el backend tiene los endpoints de prestar/devolver
    const isReturning = !libro.disponible;
    this.libroService.toggleLoan(libro.id!, isReturning).subscribe(() => {
      this.messageService.add({
        severity: 'info',
        summary: isReturning ? 'Devuelto' : 'Prestado',
      });
      this.loadBooks();
    });
  }

  getAvailableCount() {
    return this.libros.filter((b) => b.disponible).length;
  }
  getBorrowedCount() {
    return this.libros.filter((b) => !b.disponible).length;
  }

  private getEmptyBook(): Libro {
    return {
      titulo: '',
      autor: '',
      isbn: 'ISBN-',
      genero: '',
      anioPublicacion: 2024,
      disponible: true,
    };
  }
}
