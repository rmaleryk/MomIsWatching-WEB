using System.Web.Mvc;
using MomIsWatching.Models;

namespace MomIsWatching.Controllers
{
    public class IndexController : Controller
    {
        private DeviceContext DbContext { get; set; }

        // GET: Home
        public ActionResult Index()
        {
            DbContext = new DeviceContext();

            return View(DbContext);
        }

        protected override void Dispose(bool disposing)
        {
            DbContext.Dispose();
            base.Dispose(disposing);
        }
    }
}