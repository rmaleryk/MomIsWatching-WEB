using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using MomIsWatching.Models;
using DeviceContext = MomIsWatching.Models.DeviceContext;

namespace MomIsWatching.Controllers
{
    public class IndexController : Controller
    {
        private DeviceContext DbContext { get; set; } = new DeviceContext();

        // GET: Home
        public ActionResult Index()
        {
            return View(DbContext);
        }

        public ActionResult DeviceLastPosition()
        {
            var devices = new List<DeviceLog>(); 

            if(DbContext.DeviceLogs.ToList().Any())
            {
                foreach (var device in DbContext.Devices.ToList())
                {
                   devices.Add(DbContext.DeviceLogs.ToList().Last(x => x.DeviceId == device.Id.ToString()));
                }
            }
            
            return PartialView(devices);
        }

        public ActionResult DeviceRow()
        {

            return PartialView(DbContext.Devices.ToList().Last());
        }

        public JsonResult GetDeviceLastPosition()
        {

            var devices = new List<DeviceLog>();
            DbContext = new DeviceContext();

            if (DbContext.DeviceLogs.ToList().Any())
            {
                foreach (var device in DbContext.Devices.ToList())
                {
                    var temp = DbContext.DeviceLogs.ToList().Where(x => x.DeviceId == device.Id.ToString()).ToList();

                    if (temp.Any())
                    {
                        temp.Last().DeviceId = device.DeviceId;
                        devices.Add(temp.Last());
                    }
                }
            }

            return Json(devices, JsonRequestBehavior.AllowGet);
        }

        protected override void Dispose(bool disposing)
        {
            DbContext.Dispose();
            base.Dispose(disposing);
        }
    }
}