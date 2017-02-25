using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using MomIsWatching.Models;

namespace MomIsWatching.Controllers
{
    public class IndexController : Controller
    {
        private DeviceContext DbContext { get; } = new DeviceContext();

        // GET: Home
        public ActionResult Index()
        {
            return View(DbContext);
        }

        public ActionResult DeviceLastPosition()
        {
            List<DeviceLog> devices = new List<DeviceLog>(); 

            if(DbContext.DeviceLogs.ToList().Any())
            {
                foreach (Device device in DbContext.Devices.ToList())
                {
                   devices.Add(DbContext.DeviceLogs.ToList().Last(x => x.DeviceId == device.Id));
                }
            }
            
            return PartialView(devices);
        }

        public JsonResult GetDeviceLastPosition()
        {

            List<DeviceLog> devices = new List<DeviceLog>();

            if (DbContext.DeviceLogs.ToList().Any())
            {
                foreach (Device device in DbContext.Devices.ToList())
                {
                    List<DeviceLog> temp = DbContext.DeviceLogs.ToList().Where(x => x.DeviceId == device.Id).ToList();

                    if (temp.Any())
                        devices.Add(temp.Last());
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