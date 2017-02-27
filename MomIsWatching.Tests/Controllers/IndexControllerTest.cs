using System.Data.Entity;
using System.Data.Entity.Migrations;
using System.Web.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MomIsWatching.Controllers;
using MomIsWatching.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MomIsWatching.Tests.Controllers
{
    /// <summary>
    /// Сводное описание для IndexControllerTest
    /// </summary>
    [TestClass]
    public class IndexControllerTest
    {
        private IndexController _indexController;

        [TestInitialize]
        public void SetupContext()
        {
            _indexController = new IndexController();
        }

        #region Index View Test

        [TestMethod]
        public void Index_ViewResultNotNull()
        {
            var result = _indexController.Index() as ViewResult;
            Assert.IsNotNull(result);
        }

        [TestMethod]
        public void Index_ViewIsSendDbContext()
        {
            var result = _indexController.Index() as ViewResult;
            Assert.IsInstanceOfType(result?.Model, typeof(DbContext));
        }

        #endregion

        #region GetLastDevicePosition Test

        [TestMethod]
        public void GetLastDevicePosition_ReturnType()
        {
            var result = _indexController.GetDeviceLastPosition();
            Assert.IsInstanceOfType(result, typeof(JsonResult));
        }

        [TestMethod]
        public void GetLastDevicePosition_DbContextIsNotNull()
        {
            var result = _indexController.GetDeviceLastPosition();
            Assert.IsNotNull(result);
        }

        #endregion

        #region GetSosMarkers Test

        [TestMethod]
        public void GetSosMarkers_ReturnType()
        {
            var result = _indexController.GetSosMarkers("test_device_id");
            Assert.IsInstanceOfType(result, typeof(JsonResult));
        }

        [TestMethod]
        public void GetSosMarkers_IsNotNull()
        {
            var result = _indexController.GetSosMarkers("test_device_id");
            Assert.IsNotNull(result);
        }

        #endregion

        #region GetMarkers Test

        [TestMethod]
        public void GetMarkers_ReturnType()
        {
            var result = _indexController.GetMarkers("test_device_id");
            Assert.IsInstanceOfType(result, typeof(JsonResult));
        }

        [TestMethod]
        public void GetMarkers_IsNotNull()
        {
            var result = _indexController.GetMarkers("test_device_id");
            Assert.IsNotNull(result);
        }

        #endregion

        #region GetZones Test

        [TestMethod]
        public void GetZones_ReturnType()
        {
            var result = _indexController.GetZones("test_device_id");
            Assert.IsInstanceOfType(result, typeof(JsonResult));
        }

        [TestMethod]
        public void GetZones_IsNotNull()
        {
            var result = _indexController.GetZones("test_device_id");
            Assert.IsNotNull(result);
        }

        #endregion

        #region GetDeviceInfo Test

        [TestMethod]
        public void GetDeviceInfo_ReturnType()
        {
            var result = _indexController.GetDeviceInfo("test_device_id");
            Assert.IsInstanceOfType(result, typeof(JsonResult));
        }

        [TestMethod]
        public void GetDeviceInfo_IsNotNull()
        {
            var result = _indexController.GetDeviceInfo("test_device_id");
            Assert.IsNotNull(result);
        }

        #endregion

        #region SaveSettings Test

        [TestMethod]
        public void SaveSettings_WithExistingIdIsTrue()
        {
            JObject device = new JObject
            {
                ["id"] = -1,
                ["DeviceId"] = "unique_id_test",
                ["Name"] = "Test Name",
                ["Zones"] = "{\"center\" : \"45.32323;43.3232\", \"radius\" : 100}",
                ["Interval"] = 20
            };

            DeviceContext dbContext = new DeviceContext();
            dbContext.Devices.AddOrUpdate(device.ToObject<Device>());
            dbContext.SaveChanges();

            var result = _indexController.SaveSettings(JsonConvert.SerializeObject(device));
            Assert.AreEqual(result, true);
        }

        [TestMethod]
        public void SaveSettings_WithNotExistingIdIsFalse()
        {
            JObject device = new JObject
            {
                ["id"] = -1,
                ["DeviceId"] = "unique_id_test",
                ["Name"] = "Test Name",
                ["Zones"] = "{\"center\" : \"45.32323;43.3232\", \"radius\" : 100}",
                ["Interval"] = 20
            };

            DeviceContext dbContext = new DeviceContext();
            dbContext.Devices.AddOrUpdate(device.ToObject<Device>());
            dbContext.SaveChanges();

            device["DeviceId"] = "not_existed_id";

            var result = _indexController.SaveSettings(JsonConvert.SerializeObject(device));
            Assert.AreEqual(result, false);
        }


        #endregion

    }
}
