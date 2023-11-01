import express from 'express';
import translate from "./src";

const app = express();
const port = 3001;

app.use(express.json());

app.get("/", async (_req: any, res: { send: (arg0: string) => void; }) => {
    res.send("Welcome to Tero backend.");
});

app.post("/translate", async (req: { body: {text:string, to:string} }, res: { send: (arg0: string) => void; })=> {
    translate(req.body.text, {
        from: 'auto',
        to: req.body.to,
        client: "t",
        services: { google_free: true },
        priority: ["google_free"],
    }).then(res => {
        console.log(res);
    }).catch(err => {
        console.error(err);
    });
    res.send("get works")
})
app.listen(port, () => {
    console.log(`app listen on ${port}`);
});
export default app;