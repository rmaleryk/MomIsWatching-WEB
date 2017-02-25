using System;

namespace MomIsWatching.Models
{
    public class DeviceLog
    {
        public int Id { get; set; }
        public string DeviceId { get; set; }
        public string Location { get; set; }
        public int Charge { get; set; }
        public DateTime Time { get; set; }
        public bool IsSos { get; set; }

    }
}