using System;
using System.Net.WebSockets;
using Newtonsoft.Json;

namespace MomIsWatching.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string DeviceId { get; set; }
        public string Name { get; set; }
        public string Zones { get; set; }
        public int Interval { get; set; }

    }
}