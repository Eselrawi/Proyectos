package com.tuchefpersonal.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.LinearLayout;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.tuchefpersonal.app.api.AiService;
import com.tuchefpersonal.app.utils.SessionManager;
import java.util.Arrays;
import java.util.List;

public class RecipeActivity extends AppCompatActivity {

    private LinearLayout layoutLoading;
    private ScrollView layoutReceta;
    private TextView tvReceta;
    private Button btnGuardar, btnOtraReceta, btnVolver, btnHistorial;
    private List<String> ingredientes;
    private String recetaActual = "";
    private String tituloActual = "";
    private RecetaDAO recetaDAO;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_recipe);

        recetaDAO = new RecetaDAO(this);
        sessionManager = new SessionManager(this);

        layoutLoading = findViewById(R.id.layoutLoading);
        layoutReceta = findViewById(R.id.layoutReceta);
        tvReceta = findViewById(R.id.tvReceta);
        btnGuardar = findViewById(R.id.btnGuardar);
        btnOtraReceta = findViewById(R.id.btnOtraReceta);
        btnVolver = findViewById(R.id.btnVolver);
        btnHistorial = findViewById(R.id.btnHistorial);

        String ingredientesStr = getIntent().getStringExtra("ingredientes");
        ingredientes = Arrays.asList(ingredientesStr.split(","));

        generarReceta();

        btnVolver.setOnClickListener(v -> finish());
        btnOtraReceta.setOnClickListener(v -> generarReceta());
        btnHistorial.setOnClickListener(v -> startActivity(new Intent(this, HistoryActivity.class)));

        btnGuardar.setOnClickListener(v -> {
            if (recetaActual.isEmpty()) return;

            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("💾 Guardar receta");
            builder.setMessage("¿Qué nombre quieres darle a esta receta?");

            final android.widget.EditText input = new android.widget.EditText(this);
            input.setText(tituloActual);
            input.setHint("Ej: Mi receta favorita");
            input.setTextColor(Color.parseColor("#333333"));
            input.setHintTextColor(Color.parseColor("#999999"));
            input.setBackgroundColor(Color.parseColor("#FFFFFF"));
            input.setPadding(40, 30, 40, 30);
            builder.setView(input);

            builder.setPositiveButton("Guardar", (dialog, which) -> {
                String nombrePersonalizado = input.getText().toString().trim();
                if (nombrePersonalizado.isEmpty()) nombrePersonalizado = tituloActual;

                int idUsuario = sessionManager.getIdUsuario();

                // Extraer solo los ingredientes que la IA realmente usó
                String ingredientesUsados = extraerIngredientesUsados(recetaActual);

                boolean ok = recetaDAO.guardar(idUsuario, nombrePersonalizado, recetaActual, ingredientesUsados);

                if (ok) {
                    tituloActual = nombrePersonalizado;
                    Toast.makeText(this, "✅ Receta guardada como '" + nombrePersonalizado + "'", Toast.LENGTH_SHORT).show();
                    btnGuardar.setEnabled(false);
                    btnGuardar.setText("✅ Guardada");
                } else {
                    Toast.makeText(this, "Error al guardar", Toast.LENGTH_SHORT).show();
                }
            });

            builder.setNegativeButton("Cancelar", null);
            builder.show();
        });
    }

    private void generarReceta() {
        layoutLoading.setVisibility(View.VISIBLE);
        layoutReceta.setVisibility(View.GONE);
        btnGuardar.setEnabled(true);
        btnGuardar.setText("💾 Guardar receta");

        new Thread(() -> {
            try {
                String receta = AiService.generarReceta(ingredientes);
                recetaActual = receta;

                // Extraer título
                for (String linea : receta.split("\n")) {
                    if (linea.contains("NOMBRE:")) {
                        tituloActual = linea.replace("🍽️", "").replace("NOMBRE:", "").trim();
                        break;
                    }
                }
                if (tituloActual.isEmpty()) tituloActual = "Receta generada";

                runOnUiThread(() -> {
                    tvReceta.setText(receta);
                    layoutLoading.setVisibility(View.GONE);
                    layoutReceta.setVisibility(View.VISIBLE);
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    Toast.makeText(this, "Error al generar receta: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    layoutLoading.setVisibility(View.GONE);
                });
            }
        }).start();
    }

    private String extraerIngredientesUsados(String receta) {
        StringBuilder ingredientes = new StringBuilder();
        boolean enIngredientes = false;

        for (String linea : receta.split("\n")) {
            linea = linea.trim();
            if (linea.contains("📋") && linea.toUpperCase().contains("INGREDIENTES")) {
                enIngredientes = true;
                continue;
            }
            if (enIngredientes && linea.startsWith("-")) {
                String ing = linea.replace("-", "").trim();
                if (!ing.isEmpty()) {
                    if (ingredientes.length() > 0) ingredientes.append(", ");
                    ingredientes.append(ing);
                }
            }
            if (enIngredientes && (linea.contains("👨‍🍳") || linea.toUpperCase().contains("PREPARACIÓN"))) {
                break;
            }
        }

        return ingredientes.length() > 0 ? ingredientes.toString() : "Ver receta";
    }
}