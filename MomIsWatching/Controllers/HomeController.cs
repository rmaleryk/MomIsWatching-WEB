using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MomIsWatching.Models;

namespace MomIsWatching.Controllers
{
    public class HomeController : Controller
    {
        DeviceContext db = new DeviceContext();

        // GET: Home
        public ActionResult Index()
        {
            return View(db);
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }

    }
}
