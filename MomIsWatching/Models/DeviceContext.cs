using System.Data.Entity;

namespace MomIsWatching.Models
{
    public class DeviceContext : DbContext
    {
        public DbSet<Device> Devices { get; set; }
        public DbSet<DeviceLog> DeviceLogs { get; set; }

    }
}