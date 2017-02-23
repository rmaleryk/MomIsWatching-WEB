using System;
using System.Net.WebSockets;
using Newtonsoft.Json;

namespace MomIsWatching.Models
{
    public class DeviceLog
    {
        public int Id { get; set; }
        public int DeviceId { get; set; }
        public string Location { get; set; }
        public int Charge { get; set; }
        public DateTime Time { get; set; }
        public bool IsSos { get; set; }

    }
}