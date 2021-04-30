const socketIo = require("socket.io")
const { Chat, User } = require("./model")
const moment = require("moment")
require("moment-timezone")
moment.tz.setDefault("Asia/Seoul")

module.exports = async (http, app) => {
    const io = socketIo(http, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    })

    const chat = io.of("/chat")
    const global = io.of("/")

    chat.on("connection", function (socket) {
        socket.on("join", async function (data) {
            const req = socket.request
            const {
                headers: { referer },
            } = req
            console.log(referer)
            const { room, username } = data

            socket.join(room) // room - 내_id     
            const chats = await Chat.find({ room: room })
            chat.to(room).emit("load", chats)
        })

        // 내 커스텀카드 누군가 답변 (questionId) (customCard) (_id)  questionId_id
        // 좋아요 (answerId) (다른사람 배열 people) (like) (내꺼 _id)  find(answerId, _id, like) AnserIdLike_id
        // 댓글 commentid (answerId) (comment) (_id) ()

        //형석님입장
        // msg2
        // 실시간 알람
        // 태진님이 좋아요를 눌럿습니다.
        // 상균님이 좋아요를 눌럿습니다.
        // 총명님이 좋아요를 눌럿습니다. (' 스트링 ') 

        //onemit //onemit
        // msg1
        // 처음 접속시
        // 총명님 외 29명이 좋아요 like()
        // 총명님 외 28명이 댓글 comment() ('db'에서 꺼내서 보여주기)

        // 좋아요 게시글10개 20개
        // db 날짜 시간 읽었는지 안읽었는지 판별

        // 특정 이벤트 발생시 알람
        // 유저가 접속하면 무조건 (_id) room 입장시킴
        // .emit('global')(_id)

        // 누군가 좋아요를 누르면
        // 클라가 .emit("like") (_id, answerId)
        // 서버는 .on('like) db저장 _id(태진), answerId(사랑은나빠), category: like(종류)
        // 서버가 .emit('alarm') room(_id).emit(msg, answerId)
        //'사랑은나빠'에 대해 형석님ㅇ 좋아요룰 눌렀습니다, answerId
        // 클라 .on('alarm')

        // 알람20개
        // 최초 접속시 알람 (새로고침의 느낌)
        // 유저가 접속하면 무조건 _id room 입장시킴
        // 클라가 .emit('global') (_id)
        // 서버는 .on('global') Alarm db 불러와야함 .emit('global) (db 다 보내주기)
        // 여기에 뭔가 들어와있으면 뱃지를 띄우면 되겠군
        // .on('global) { ....., ..., }
        // check = true / false

        // 외 18명이 a라는글에 좋아요를 눌렀습니다.(Al)

        // msg answerId , check = true , false
        // 좋아요 외3명

        // 읽음 , 확인
        // 클릭시
        // .emit('check') (AlarmId)
        // .on('check') (db 교체 check 교체 ) (db 다시 뿌려주기)




        socket.on("send", async function (data) {
            const { room } = data
            const content = new Chat({
                ...data,
                createdAt: moment().format("YYYY-MM-DD-HH:mm"),
            })
            await content.save()
            chat.to(room).emit("receive", content)
        })

        socket.on("leave", (data) => {
            console.log("leave")
            socket.leave(data.room)
        })

        socket.on("disconnect", () => {
            console.log("disconnect")
        })
    })

    global.on("connection", function (socket) {
        socket.on("globalSend", async function (data) {
            console.log(data)
            global.emit("globalReceive", data)
        })
    })
}
