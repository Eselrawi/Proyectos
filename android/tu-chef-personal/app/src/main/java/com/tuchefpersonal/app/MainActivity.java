package com.tuchefpersonal.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.textfield.TextInputEditText;
import com.tuchefpersonal.app.modelo.Ingrediente;
import com.tuchefpersonal.app.utils.SessionManager;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private TextInputEditText etIngrediente;
    private Button btnAnadir, btnGenerarReceta, btnLimpiar, btnCerrarSesion, btnMisRecetas;
    private TextView tvNombreUsuario, tvContador;
    private RecyclerView rvIngredientes;
    private IngredienteAdapter adapter;
    private IngredienteDAO ingredienteDAO;
    private SessionManager sessionManager;
    private List<Ingrediente> listaIngredientes;
    private int idUsuario;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sessionManager = new SessionManager(this);
        ingredienteDAO = new IngredienteDAO(this);
        idUsuario = sessionManager.getIdUsuario();

        etIngrediente = findViewById(R.id.etIngrediente);
        btnAnadir = findViewById(R.id.btnAnadir);
        btnGenerarReceta = findViewById(R.id.btnGenerarReceta);
        btnLimpiar = findViewById(R.id.btnLimpiar);
        btnCerrarSesion = findViewById(R.id.btnCerrarSesion);
        tvNombreUsuario = findViewById(R.id.tvNombreUsuario);
        tvContador = findViewById(R.id.tvContador);
        rvIngredientes = findViewById(R.id.rvIngredientes);
        btnMisRecetas = findViewById(R.id.btnMisRecetas);

        tvNombreUsuario.setText(sessionManager.getNombre());

        cargarIngredientes();

        btnAnadir.setOnClickListener(v -> anadirIngrediente());
        etIngrediente.setOnEditorActionListener((v, actionId, event) -> {
            anadirIngrediente();
            return true;
        });

        btnLimpiar.setOnClickListener(v -> {
            ingredienteDAO.eliminarTodos(idUsuario);
            cargarIngredientes();
            Toast.makeText(this, "Cocina vaciada", Toast.LENGTH_SHORT).show();
        });

        btnGenerarReceta.setOnClickListener(v -> {
            if (listaIngredientes.isEmpty()) {
                Toast.makeText(this, "Añade al menos un ingrediente", Toast.LENGTH_SHORT).show();
                return;
            }
            Intent intent = new Intent(this, RecipeActivity.class);
            StringBuilder sb = new StringBuilder();
            for (Ingrediente i : listaIngredientes) {
                if (sb.length() > 0) sb.append(",");
                sb.append(i.getNombre());
            }
            intent.putExtra("ingredientes", sb.toString());
            startActivity(intent);
        });

        btnCerrarSesion.setOnClickListener(v -> {
            sessionManager.cerrarSesion();
            Intent intent = new Intent(this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });
        btnMisRecetas.setOnClickListener(v -> {
            startActivity(new Intent(this, HistoryActivity.class));
        });
    }

    private void cargarIngredientes() {
        listaIngredientes = ingredienteDAO.obtenerPorUsuario(idUsuario);
        adapter = new IngredienteAdapter(listaIngredientes, (ingrediente, position) -> {
            ingredienteDAO.eliminar(ingrediente.getId());
            listaIngredientes.remove(position);
            adapter.notifyItemRemoved(position);
            actualizarContador();
        });
        rvIngredientes.setLayoutManager(new LinearLayoutManager(this));
        rvIngredientes.setAdapter(adapter);
        actualizarContador();
    }

    private void anadirIngrediente() {
        String nombre = etIngrediente.getText().toString().trim();
        if (nombre.isEmpty()) return;
        ingredienteDAO.añadir(idUsuario, nombre);
        etIngrediente.setText("");
        cargarIngredientes();
    }

    private void actualizarContador() {
        tvContador.setText(listaIngredientes.size() + " ingredientes disponibles");
    }
}