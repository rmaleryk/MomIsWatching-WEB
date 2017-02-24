using System.Collections.Generic;
using System.Net.WebSockets;

namespace MomIsWatching.Models
{
    public class Clients
    {
        // Список онлайн клиентов
        public static readonly List<OnlineDevice> Devices = new List<OnlineDevice>();
        public static readonly List<OnlineMap> Maps = new List<OnlineMap>();
    }

    public class OnlineDevice
    {
        public Device Instance { get; set; }
        public DeviceLog Log { get; set; }
        public WebSocket Websocket { get; set; }
    }

    public class OnlineMap
    {
        public WebSocket Websocket { get; set; }
    }
}