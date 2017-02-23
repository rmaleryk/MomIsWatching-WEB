using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MomIsWatching.Models;

namespace MomIsWatching.Controllers
{
    public class IndexController : Controller
    {
        DeviceContext db = new DeviceContext();

        // GET: Index
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