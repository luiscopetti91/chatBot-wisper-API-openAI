const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
require("dotenv").config(); // Carga las variables de entorno desde el archivo .env

// Importa el módulo para iniciar el portal web que permite escanear el código QR de WhatsApp
const QRPortalWeb = require('@bot-whatsapp/portal');

// Importa el proveedor Baileys, que permite la conexión con WhatsApp utilizando el protocolo baileys
const BaileysProvider = require('@bot-whatsapp/provider/baileys');

// Importa el adaptador Mock, utilizado para simular una base de datos en memoria para pruebas y desarrollo
const MockAdapter = require('@bot-whatsapp/database/mock');

// Importa el módulo 'path', que proporciona utilidades para trabajar con rutas de archivos y directorios
const path = require("path");

// Importa el módulo 'fs', que proporciona utilidades para trabajar con el sistema de archivos
const fs = require("fs");

// Importa el módulo de chatGPT, que maneja la lógica de conversación utilizando OpenAI
const chat = require('./chatGPT');

const { handlerAI } = require("./whisper")


// Ruta al archivo que contiene los mensajes de consulta
const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt");
// Lee el contenido del archivo de consultas
const promptConsultas = fs.readFileSync(pathConsultas, "utf8");





const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Esta es una nota de voz", null, async (ctx, ctxFn) => {
    const text = await handlerAI(ctx)
    const prompt = promptConsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)
   // console.log(text)
})



// Definición del flujo principal del bot
const principal = addKeyword(EVENTS.WELCOME)
    // Respuestas automáticas al ingresar un texto
    .addAnswer("Realiza tu pregunta:", { capture: true }, async (ctx, ctxFn) => {
        // Captura el mensaje del usuario
        const prompt = promptConsultas;
        const consulta = ctx.body;
        // Genera una respuesta utilizando el módulo chatGPT
        const answer = await chat(prompt, consulta);
        // Envía la respuesta al usuario
        await ctxFn.flowDynamic(answer.content);

      
    });
    

// Función principal que inicializa el bot
const main = async () => {
    // Inicializa el adaptador de la base de datos
    const adapterDB = new MockAdapter();
    // Crea el flujo del bot
    const adapterFlow = createFlow([principal, flowVoice]);
    // Crea el proveedor de mensajes
    const adapterProvider = createProvider(BaileysProvider);

    // Crea el bot con los adaptadores y el flujo definido
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    // Inicia el portal web para escanear el código QR de WhatsApp
    QRPortalWeb();
};

// Ejecuta la función principal
main();
