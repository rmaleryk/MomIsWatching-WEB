using System;
using System.Data.Entity.Migrations;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.WebSockets;
using MomIsWatching.Models;
using Newtonsoft.Json.Linq;

namespace MomIsWatching.Subscriptions
{
    /// <summary>
    /// Сводное описание для DeviceSubscriptionHandler
    /// </summary>
    public class DeviceSubscriptionHandler : IHttpHandler
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
            var deviceSocket = context.WebSocket;

            // Получаем айди девайса из запроса
            string rDeviceId = context.QueryString["deviceId"];

            // Если устройство не дает айди - выходим
            if (string.IsNullOrEmpty(rDeviceId)) return;

            var db = new DeviceContext();
            var onlineDevice = new OnlineDevice();
            
            // Добавляем его в список клиентов-девайсов
            Locker.EnterWriteLock();
            try
            {
                // Смотрим, есть ли в базе такой девайс, если нет - добавляем в Devices
                var devices = db.Devices.ToList().Where(x => x.DeviceId == rDeviceId).ToList();

                if (devices.Count == 0)
                {
                    int index = 0;
                    if (db.Devices.ToList().Count > 0)
                        index = db.Devices.ToList().Last().Id + 1;
                    
                    devices.Add(new Device { Id = index, DeviceId = rDeviceId, Interval = 5, Name = "NoName", Zones = ""} );

                    db.Devices.AddOrUpdate(devices[0]);
                    // Коммитим изменения в БД
                    db.SaveChanges();
                }

                onlineDevice.Instance = devices[0];
                onlineDevice.Websocket = deviceSocket;

                Clients.Devices.Add(onlineDevice);

            }
            finally
            {
                Locker.ExitWriteLock();
            }

            
            while (true)
            {
                var buffer = new ArraySegment<byte>(new byte[1024]);
                
                // Ожидаем данные
                await deviceSocket.ReceiveAsync(buffer, CancellationToken.None);

                // TODO: нужно подумать, как красиво убрать хвост от массива из 1024 элементов
                // Убираем пустые элементы массива (небольшой костыль)
                buffer = new ArraySegment<byte>(buffer.Where(x => x != 0).ToArray());

                var str = Encoding.Default.GetString(buffer.Array);
                
                try
                {
                    // Парсим Json
                    dynamic deviceLog = JObject.Parse(str);

                    int index = 0;
                    if (db.DeviceLogs.ToList().Count > 0)
                        index = db.DeviceLogs.ToList().Last().Id + 1;

                    var log = new DeviceLog
                    {
                        Id = index,
                        DeviceId = onlineDevice.Instance.Id.ToString(),
                        Charge = deviceLog.Charge,
                        Location = deviceLog.Location,
                        IsSos = deviceLog.IsSos,
                        Time = DateTime.Now
                    };

                    // Ищем среди онлайн устройств наше, чтобы заменить у него текущий лог
                    // ох, уже эти предикаты... сэкономили 10 строчек кода
                    Clients.Devices.FindAll(x => x == onlineDevice).ForEach(x => x.Log = log);

                    // Добавляем лог в БД
                    db.DeviceLogs.AddOrUpdate(log);
                    // Коммитим изменения в БД
                    db.SaveChanges();

                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }

                //Передаём сообщение всем клиентам-картам
                for (int i = 0; i < Clients.Maps.Count; i++)
                {

                    var client = Clients.Maps[i];

                    try
                    {
                        if (client.Websocket.State == WebSocketState.Open)
                        {
                            await client.Websocket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
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
                }

                // Отправляем конфигурацию обратно на девайс (интервал обновления)
                db = new DeviceContext();
                var tempDev = db.Devices.ToList().FirstOrDefault(x => x.Id == onlineDevice.Instance.Id);

                if (tempDev != null)
                    await deviceSocket.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(tempDev.Interval.ToString())), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        public bool IsReusable { get; } = false;
    }
}