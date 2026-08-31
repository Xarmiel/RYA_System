package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.request.CategoriaCreateDto;
import com.ecommerce.backend.dto.response.CategoriaResponseDto;
import com.ecommerce.backend.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @PostMapping
    public ResponseEntity<CategoriaResponseDto> crearCategoria(@Valid @RequestBody CategoriaCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crearCategoria(dto));
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponseDto>> listarCategorias(
            @RequestParam(name = "soloRaices", defaultValue = "false") boolean soloRaices) {
        if (soloRaices) {
            return ResponseEntity.ok(categoriaService.listarRaices());
        }
        return ResponseEntity.ok(categoriaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponseDto> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(categoriaService.obtenerPorId(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoriaResponseDto> obtenerPorSlug(@PathVariable String slug) {
        return ResponseEntity.ok(categoriaService.obtenerPorSlug(slug));
    }
}