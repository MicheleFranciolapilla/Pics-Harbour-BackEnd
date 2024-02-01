function home(req, res)
{
    console.log("Ciao dalla home");
    res.send("Ciao");
}

module.exports = home;