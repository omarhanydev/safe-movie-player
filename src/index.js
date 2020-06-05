const {app, BrowserWindow, Menu } = require("electron");
const url = require("url");
const path = require("path");
let mainWin;
let addWin;

//electron reload
// if(process.env.NODE_ENV !== "production"){
//     require("electron-reload")(__dirname, {
//         electron: path.join(__dirname, "../node_modules", ".bin", "electron.cmd")
//     });
// }

// create main window

const createWindow = () => {
    mainWin = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 1200,
        height: 680,
        // frame: false,
        backgroundColor: "#ffffff",
        icon: path.join(__dirname, "public/images/logo.png")
    });
    mainWin.setMenuBarVisibility(false);

    mainWin.loadURL(url.format({
        pathname: path.join(__dirname, "views/index.html"),
        protocol: "file",
        slashes: true
    }));

    mainWin.on("closed", () =>{
        mainWin = null;
        app.quit();
    });

};

// Main Menu Template
// const mainMenuTemplate = [
//     {
//         label: 'File',
//         submenu: [
//             {
//                 label: 'Open File',
//                 click(){
//                     createAddWindow();
//                 }
//             },
//             {
//                 label: 'Open Subtitle',
//                 click(){
//                     alert(2);
//                 }
//             },
//             {
//                 label: 'Open .safe File',
//                 click(){
//                     alert(3);
//                 }
//             },
//             {
//                 label: 'Quit',
//                 accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
//                 click(){
//                     app.quit();
//                 }
//             }
//         ]
//     },
//     {
//         label: 'Help',
//         submenu: [
//             {
//                 label: 'How to Use',
//                 click(){
//                     alert(1);
//                 }
//             },
//             {
//                 label: 'About Safe Video Player',
//                 click(){
//                     alert(2);
//                 }
//             }
//         ]
//     }
// ];
//
// if(process.platform == 'darwin'){
//     mainMenuTemplate.unshift({});
// }

app.on("ready", async() => {
    // const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Menu.setApplicationMenu(mainMenu);
    await createWindow();
});
