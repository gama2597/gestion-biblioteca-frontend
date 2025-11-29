import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';

// Services & Models
import { MessageService, ConfirmationService } from 'primeng/api';
import { LibroService } from 'src/app/services/libro.service';
import { Libro } from 'src/app/models/libro.model';
import { Observable } from 'rxjs';

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
    TooltipModule,
    TabViewModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './libro-catalog.component.html',
  styleUrl: './libro-catalog.component.scss',
})
export class LibroCatalogComponent implements OnInit {
  private libroService = inject(LibroService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  libros: Libro[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  activeTabIndex: number = 0; // 0: Todos, 1: Disponibles, 2: Prestados

  // Modal Control
  libroDialog: boolean = false;
  isEditing: boolean = false;
  isSubmitted: boolean = false;
  libroActual: Libro = this.getEmptyBook();

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading = true;

    if (this.searchTerm) {
      this.libroService.getAll(this.searchTerm).subscribe({
        next: (data) => {
          if (this.activeTabIndex === 0) { // Todos
             this.libros = data;
          } else if (this.activeTabIndex === 1) { // Disponibles
             this.libros = data.filter(l => l.disponible);
          } else if (this.activeTabIndex === 2) { // Prestados
             this.libros = data.filter(l => !l.disponible);
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron resultados' });
        }
      });

    } else {
      let request: Observable<Libro[]>;

      if (this.activeTabIndex === 0) {
        request = this.libroService.getAll();
      } else if (this.activeTabIndex === 1) {
        request = this.libroService.getByStatus('disponibles');
      } else {
        request = this.libroService.getByStatus('prestados');
      }

      request.subscribe({
        next: (data) => {
          this.libros = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista' });
        }
      });
    }
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    this.loadBooks();
  }

  onSearch() {
    this.loadBooks();
  }

  openNew() {
    this.libroActual = this.getEmptyBook();
    this.isEditing = false;
    this.isSubmitted = false;
    this.libroDialog = true;
  }

  editBook(libro: Libro) {
    this.libroActual = { ...libro };
    this.isEditing = true;
    this.isSubmitted = false;
    this.libroDialog = true;
  }

  saveBook() {
    this.isSubmitted = true;
    if (
      !this.libroActual.titulo ||
      !this.libroActual.isbn ||
      !this.libroActual.autor
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Completa los campos obligatorios (*)',
      });
      return;
    }

    const request = this.isEditing
      ? this.libroService.update(this.libroActual.id!, this.libroActual)
      : this.libroService.create(this.libroActual);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registro guardado correctamente',
        });
        this.libroDialog = false;
        this.loadBooks();
      },
      error: (err) => {
        if (err.status === 409) {
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicado',
            detail: 'El ISBN ya existe en el sistema.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Verifica los datos ingresados.',
          });
        }
      },
    });
  }

  deleteBook(libro: Libro) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${libro.titulo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.libroService.delete(libro.id!).subscribe(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Eliminado',
            detail: 'Libro eliminado del catálogo',
          });
          this.loadBooks();
        });
      },
    });
  }

  toggleLoan(libro: Libro) {
    const isReturning = !libro.disponible;
    this.libroService.toggleLoan(libro.id!, isReturning).subscribe({
      next: () => {
        const msg = isReturning
          ? 'Libro devuelto a estantería'
          : 'Libro prestado exitosamente';
        this.messageService.add({
          severity: 'info',
          summary: 'Operación Exitosa',
          detail: msg,
        });
        this.loadBooks();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error de proceso',
        });
      },
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
      anioPublicacion: 2025,
      disponible: true,
    };
  }
}
