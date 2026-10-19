let isSubmitting = false;
let editingID = null;

// Send a query to the database and return the parsed JSON response.
const runQuery = async (sql) => {
    try {
        const response = await fetch("https://jkilleen02.webhosting1.eeecs.qub.ac.uk/dbConnector.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "query=" + encodeURIComponent(sql)
        })

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.log(error.message);
    }
};

// Fetch every animal from the database and rebuild the table.
const loadAnimals = async () => {
    const result = await runQuery("SELECT * FROM tblanimal");

    const tbody = document.querySelector("#animalTable tbody");
    tbody.innerHTML = "";

    if (!result || !result.success) return;

    result.data.forEach(animal => {
        tbody.innerHTML += `
            <tr>
                <td>${animal.animalID}</td>
                <td>${animal.animalName}</td>
                <td>${animal.animalAge ?? ""}</td>
                <td>${animal.animalSpecies}</td>
                <td>${animal.gender}</td>
                <td>
                    <button onclick="startEdit(${animal.animalID}, '${animal.animalName}', '${animal.animalAge}', '${animal.animalSpecies}', '${animal.gender}')">Edit</button>
                    <button class="delete-btn" onclick="deleteAnimal(${animal.animalID})">Delete</button>
                </td>
            </tr>
        `;
    });
};

// Check all form fields are valid before hitting the database.
// Returns an error message string, or an empty string if everything is fine.
const validateAnimal = (name, age, species, gender) => {
    if (!name || !species || !gender) {
        return "Please fill in all required fields.";
    }

    if (!["Male", "Female", "Unknown"].includes(gender)) {
        return "Gender must be Male, Female, or Unknown.";
    }

    if (age !== "" && Number(age) <= 0) {
        return "Age must be greater than 0.";
    }

    // Empty string means validation passed.
    return "";
};

// 'Submit' button being pressed:
document.getElementById("animalForm").addEventListener("submit", async (e) => {
    e.preventDefault(); //Prevents page from refreshing

    // Prevent double-submission if the user clicks quickly.
    if (isSubmitting) return; //If a submission is already in progress (true) it will stop the function.

    const name = document.getElementById("name").value.trim();  //These gets what the user has typed
    const age = document.getElementById("age").value;
    const species = document.getElementById("species").value.trim();
    const gender = document.getElementById("gender").value.trim();
    const message = document.getElementById("message"); //Message is used to show success/error

    const error = validateAnimal(name, age, species, gender); //Run validation check
    if (error) {
        message.innerText = error;
        return;
    }

    isSubmitting = true; //When submitting = true, submit button cannot be clicked

    // Build the correct query depending on whether user is adding or editing.
    let sql;
    if (editingID === null) {
        sql = `INSERT INTO tblanimal (animalName, animalAge, animalSpecies, gender)
               VALUES ('${name}', '${age}', '${species}', '${gender}')`;
    } else {
        sql = `UPDATE tblanimal
               SET animalName='${name}', animalAge='${age}', animalSpecies='${species}', gender='${gender}'
               WHERE animalID=${editingID}`;
    }

    const result = await runQuery(sql);

    if (result && result.success) {
        message.innerText = editingID === null ? "Animal added successfully." : "Animal updated successfully.";
        document.getElementById("animalForm").reset(); //Remove the user inputs from form
        editingID = null;
        document.querySelector("button[type='submit']").innerText = "Add Animal";
        loadAnimals(); //Load table again
    } else {
        message.innerText = "Error: " + (result?.message ?? "Something went wrong.");
    }

    isSubmitting = false;
});

// Populate the form fields so the user can edit an existing animal.
const startEdit = (id, name, age, species, gender) => {
    document.getElementById("name").value = name;
    document.getElementById("age").value = age;
    document.getElementById("species").value = species;
    document.getElementById("gender").value = gender;

    editingID = id;

    // Change the button label so it's clear user is updating, not adding.
    document.querySelector("button[type='submit']").innerText = "Update Animal";
};

// Ask for confirmation then remove the animal from the database.
const deleteAnimal = async (id) => {
    if (!confirm("Are you sure you want to delete this animal?")) return;

    const result = await runQuery(`DELETE FROM tblanimal WHERE animalID=${id}`);

    if (result && result.success) {
        document.getElementById("message").innerText = "Animal deleted successfully.";
        loadAnimals();
    } else {
        alert("Error: " + (result?.message ?? "Something went wrong."));
    }
};

// Load the animal list as soon as the page is ready.
window.onload = loadAnimals;