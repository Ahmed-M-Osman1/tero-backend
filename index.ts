import express from 'express';
import translate from "./src";

const app = express();
const port = 3001;

app.use(express.json());

app.get("/", async (_req: express.Request, res: express.Response) => {
    res.send("Welcome to Tero backend.");
});

app.post("/translate", async (req: express.Request, res: express.Response)=> {
    translate(req.body.text, {
        from: 'auto',
        to: req.body.to,
        client: "t",
        services: { google_free: true },
        priority: ["google_free"],
    }).then(resp => {
        res.send(resp)
    }).catch(err => {
        res.send(err)
    });

})
app.listen(port, () => {
    console.log(`app listen on ${port}`);
});
export default app;