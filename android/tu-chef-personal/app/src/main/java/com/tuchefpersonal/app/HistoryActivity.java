package com.tuchefpersonal.app;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.tuchefpersonal.app.modelo.Receta;
import com.tuchefpersonal.app.utils.SessionManager;
import java.util.ArrayList;
import java.util.List;

public class HistoryActivity extends AppCompatActivity {

    private RecyclerView rvRecetas;
    private View layoutVacio;
    private Button btnVolverMain;
    private RecetaDAO recetaDAO;
    private SessionManager sessionManager;
    private List<Receta> listaRecetas;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);

        recetaDAO = new RecetaDAO(this);
        sessionManager = new SessionManager(this);

        rvRecetas = findViewById(R.id.rvRecetas);
        layoutVacio = findViewById(R.id.layoutVacio);
        btnVolverMain = findViewById(R.id.btnVolverMain);

        btnVolverMain.setOnClickListener(v -> finish());

        cargarHistorial();
    }

    private void cargarHistorial() {
        int idUsuario = sessionManager.getIdUsuario();
        listaRecetas = recetaDAO.obtenerPorUsuario(idUsuario, false);

        if (listaRecetas.isEmpty()) {
            layoutVacio.setVisibility(View.VISIBLE);
            rvRecetas.setVisibility(View.GONE);
        } else {
            layoutVacio.setVisibility(View.GONE);
            rvRecetas.setVisibility(View.VISIBLE);

            final RecetaAdapter[] adapterHolder = new RecetaAdapter[1];

            RecetaAdapter adapter = new RecetaAdapter(
                    new ArrayList<>(listaRecetas),
                    (receta, position) -> {
                        boolean nuevoEstado = !receta.isFavorito();
                        recetaDAO.marcarFavorito(receta.getId(), nuevoEstado);
                        receta.setFavorito(nuevoEstado);
                        if (adapterHolder[0] != null) {
                            adapterHolder[0].notifyItemChanged(position);
                        }
                    },
                    receta -> {
                        new AlertDialog.Builder(this)
                                .setTitle("🍽️ " + receta.getTitulo())
                                .setMessage(receta.getContenido())
                                .setPositiveButton("Cerrar", null)
                                .show();
                    },
                    (receta, position) -> {
                        new AlertDialog.Builder(this)
                                .setTitle("🗑️ Eliminar receta")
                                .setMessage("¿Seguro que quieres eliminar \"" + receta.getTitulo() + "\"?")
                                .setPositiveButton("Eliminar", (dialog, which) -> {
                                    recetaDAO.eliminar(receta.getId());
                                    listaRecetas.remove(position);
                                    adapterHolder[0].notifyItemRemoved(position);
                                    Toast.makeText(this, "Receta eliminada", Toast.LENGTH_SHORT).show();
                                    if (listaRecetas.isEmpty()) {
                                        cargarHistorial();
                                    }
                                })
                                .setNegativeButton("Cancelar", null)
                                .show();
                    }
            );

            adapterHolder[0] = adapter;

            rvRecetas.setLayoutManager(new LinearLayoutManager(this));
            rvRecetas.setAdapter(adapter);
        }
    }
}