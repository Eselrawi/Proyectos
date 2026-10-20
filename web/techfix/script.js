let tickets = [
    {
        title: "Ordenador no arranca",
        description: "El equipo muestra pantalla negra al iniciar.",
        category: "Hardware",
        priority: "Alta",
        status: "En progreso",
        user: "Carlos"
    },
    {
        title: "Error al iniciar sesión",
        description: "El usuario no puede acceder a su cuenta.",
        category: "Software",
        priority: "Media",
        status: "Pendiente",
        user: "Laura"
    },
    {
        title: "Problemas con WiFi",
        description: "Conexión intermitente en la oficina.",
        category: "Red",
        priority: "Alta",
        status: "En progreso",
        user: "Miguel"
    },
    {
        title: "Instalar Microsoft Office",
        description: "Instalación solicitada para nuevo equipo.",
        category: "Software",
        priority: "Baja",
        status: "Resuelta",
        user: "Ana"
    },
    {
        title: "Teclado no funciona",
        description: "Algunas teclas no responden.",
        category: "Hardware",
        priority: "Baja",
        status: "Resuelta",
        user: "David"
    },
    {
        title: "Impresora desconectada",
        description: "La impresora no aparece en la red.",
        category: "Red",
        priority: "Media",
        status: "Pendiente",
        user: "Sara"
    }
];

let currentFilter = "all";

function renderTickets() {

    const table = document.getElementById("ticketTable");

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();

    table.innerHTML = "";

    let filtered = tickets.filter(ticket => {

        const matchesFilter =
            currentFilter === "all" ||
            ticket.status === currentFilter;

        const matchesSearch =
            ticket.title.toLowerCase().includes(search) ||
            ticket.description.toLowerCase().includes(search);

        return matchesFilter && matchesSearch;
    });

    filtered.forEach(ticket => {

        const priorityClass =
            ticket.priority === "Alta"
                ? "high"
                : ticket.priority === "Media"
                ? "medium"
                : "low";

        const statusClass =
            ticket.status === "Resuelta"
                ? "resolved"
                : "status";

        table.innerHTML += `
            <tr>
                <td>
                    <div class="ticket-title">${ticket.title}</div>
                    <div class="ticket-description">
                        ${ticket.description}
                    </div>
                </td>

                <td>${ticket.category}</td>

                <td>
                    <span class="badge ${priorityClass}">
                        ${ticket.priority}
                    </span>
                </td>

                <td>
                    <span class="badge ${statusClass}">
                        ${ticket.status}
                    </span>
                </td>

                <td>${ticket.user}</td>
            </tr>
        `;
    });

    updateStats();
}

function updateStats() {

    document.getElementById("total").textContent =
        tickets.length;

    document.getElementById("pending").textContent =
        tickets.filter(t => t.status === "Pendiente").length;

    document.getElementById("progress").textContent =
        tickets.filter(t => t.status === "En progreso").length;

    document.getElementById("resolved").textContent =
        tickets.filter(t => t.status === "Resuelta").length;
}

function filterTickets(filter, button) {

    currentFilter = filter;

    document
        .querySelectorAll(".filter")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    renderTickets();
}

function searchTickets() {
    renderTickets();
}

function openModal() {
    document.getElementById("modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function addTicket() {

    const title =
        document.getElementById("title").value;

    const description =
        document.getElementById("description").value;

    const category =
        document.getElementById("category").value;

    const priority =
        document.getElementById("priority").value;

    if (!title || !description) {
        alert("Completa todos los campos.");
        return;
    }

    tickets.unshift({
        title,
        description,
        category,
        priority,
        status: "Pendiente",
        user: "Raúl"
    });

    document.getElementById("title").value = "";
    document.getElementById("description").value = "";

    closeModal();

    renderTickets();
}

renderTickets();