using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Web;

namespace MomIsWatching
{
    public class Clients
    {
        // Список онлайн клиентов
        public static readonly List<WebSocket> Devices = new List<WebSocket>();
        public static readonly List<WebSocket> Maps = new List<WebSocket>();
    }
}