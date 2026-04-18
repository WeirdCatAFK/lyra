const app = require("./app");

app.listen(app.get('port'), () => {
    console.log("Servidor activo en puerto", app.get("port"));
});