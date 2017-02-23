using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.WebSockets;
using MomIsWatching.Models;

namespace MomIsWatching.Subscriptions
{
    /// <summary>
    /// Сводное описание для MapSubscriptionHandler
    /// </summary>
    public class MapSubscriptionHandler : IHttpHandler
    {

        // Блокировка для обеспечения потокабезопасности
        private static readonly ReaderWriterLockSlim Locker = new ReaderWriterLockSlim();

        public void ProcessRequest(HttpContext context)
        {
            //Если запрос является запросом веб сокета
            if (context.IsWebSocketRequest)
            {

                context.AcceptWebSocketRequest(WebSocketRequest);
            }
            else
            {
                context.Response.Write("Access Denied!");
            }


        }

        private async Task WebSocketRequest(AspNetWebSocketContext context)
        {
            // Получаем сокет клиента-девайса из контекста запроса
            var socket = context.WebSocket;

            // Добавляем его в список клиентов-девайсов
            Locker.EnterWriteLock();
            try
            {
                Clients.Maps.Add(new OnlineMap() { Websocket = socket });
            }
            finally
            {
                Locker.ExitWriteLock();
            }


            while (true)
            {
                var buffer = new ArraySegment<byte>(new byte[1024]);

                // Ожидаем данные
                var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
                

                //Передаём сообщение всем клиентам-картам
                /*for (int i = 0; i < Clients.Maps.Count; i++)
                {

                    WebSocket client = Clients.Maps[i];

                    try
                    {
                        if (client.State == WebSocketState.Open)
                        {
                            await client.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                        }
                    }
                    catch (ObjectDisposedException)
                    {
                        Locker.EnterWriteLock();
                        try
                        {
                            Clients.Maps.Remove(client);
                            i--;
                        }
                        finally
                        {
                            Locker.ExitWriteLock();
                        }
                    }
                }*/



            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}