# 생각 낙서 (Back-end)


![KakaoTalk_20210527_195939625](https://1.bp.blogspot.com/-6IAP9M_fLns/YLHhGIvltTI/AAAAAAAAAVQ/LmSm2Dh4Lz03iyBYTsrUMDZZmNYSgOvQgCLcBGAsYHQ/s2048/%25EC%258D%25B8%25EB%2584%25A4%25EC%259D%25BC.png)


<!--
## 목차
1. [생각낙서 소개](#생각낙서-소개)
2. [개요](#개요)
3. [개발환경](#기능정보)
4. [기능정보](#기능정보)
5. [DB 설계](#DB-설계)
6. [API 설계](#API-설계)
7. [힘들었던 점 및 개선](#힘들었던-점-및-개선)
8. [상세 설명 페이지](#상세-설명-페이지)
9. [Frond-End(React) 코드](#front-endreact-코드)
-->
## 🔦 웹 사이트
- [https://thinknote.online](https://thinknote.online)

## 💡 생각낙서 소개

- 친구들은 어떤 생각을 하고 있는지 궁금하지 않나요?
- 매일 3개씩, 재미있는 질문에 생각을 남기면 편하게 책장에 채워드려요. 😀 
- 구글, 네이버, 카카오 로그인으로 간편하게!
- 간편하게 생각을 공유해보세요. ^_^ 🌈

## 🔍 Target
- 매번 비슷한 내용의 일기보다 의미있는 생각을 적고 싶은 10대, 20대
- 자신의 생각을 간편하게 정리하여 보고 싶은 사람
- 친구, 애인 등 주변의 생각을 알아가고 더욱 관계가 깊어지고 싶을 때 

## 📌 개요 
- 이름: 생각낙서
- 기간: 2021.04.25 ~ 2021.05.28
- 팀원
  - Front-end(React): 조형석, 이대호, 임다빈
  - Back-end(Node.js): 강태진, 조상균, 이총명
  - Designer(UI/UX): 성지원

## 🔌 개발 환경
- Server: AWS EC2(Ubuntu 20.04 LTS)
- Framework: Express(Node.js)
- Database: MongoDB
- Load Balancer: Nginx
- ETC: AWS S3

## 🔭 주요 라이브러리
socket.io, passport, mongoose, jsonwebtoken, multer, sharp, sdk, sanitize-html, dotenv

## ✨ 주요 기능
#### 1. 소셜 로그인
- 구글, 네이버, 카카오 계정을 활용한 소셜 로그인 방식 적용
#### 2. 오늘의 낙서 - 매일 질문 3개받고 쓰기 
- 사이트 질문 혹은 팔로잉한 친구가 만든 질문을 받아 볼 수 있습니다. 
- 최근 2주내에 답변한 질문은 보여지지 않습니다. 
- 답변은 1000자 이내로 작성 할 수 있으며, 전체공개 또는 비공개로 설정할 수 있습니다.
#### 3. 책장 페이지
- 오늘의 낙서에서 남긴 일자별로 답변을 모아 볼 수 있습니다. 
- 하루에 한 개씩 나만의 질문을 작성하여, 나를 팔로우 하는 친구들이 그 질문에 대해 답변할 수 있습니다.
- 나의 책장에서는 닉네임과 프로필 사진, 자기소개, 선호하는 태그를 수정할 수 있으며, 사진을 업로드시 자동으로 가로 400px 자동으로 리사이징 됩니다.  (multer-s3-transform, sharp 라이브러리 사용)
- 책장 페이지에서 팔로우를 신청 할 수 있으며, 팔로잉 팔로워를 조회할 수 있습니다.
#### 4. 답변 상세 확인
- 마음에 드는 답변에 좋아요를 남길 수 있으며, 좋아요 누른 사람들의 목록을 조회할 수 있습니다. 
- 댓글은 100자 이내로 작성 할 수 있으며, '@'를 사용하여 다른 사용자를 태그 할 수 있습니다. 
- 댓글에도 좋아요를 남길 수 있습니다.
- 자기가 쓴 답변은 수정 및 삭제를 할 수 있습니다.
#### 5. 유저 검색 
- 검색 기능으로 사용자를 찾을 수 있습니다
- 닉네임 일부분만 입력해도 해당하는 글자가 들어간 유저가 결과에 표시됩니다. 
- 최근 검색한 유저는 최대 5개까지 검색 리스트에 표시됩니다.
#### 6. 실시간 알림
- 누군가 자신이 쓴 글에 댓글이나 좋아요를 남기면 알림을 통해 확인할 수 있습니다.  
- 누군가 자신을 언급하거나 팔로잉 하면 알림을 통해 확인 할 수 있습니다.
#### 7. 크롬 익스텐션
- 크롬 웹스토어에서 '생각 낙서' 확장 프로그램을 다운 받을 수 있습니다.
- 다른 사람들이 어떤 생각을 하는지 간편하게 볼 수 있습니다.


## DB 설계 
![image](https://user-images.githubusercontent.com/79817676/119849209-68658900-bf47-11eb-9e88-832a99e86322.png)


## 주요 API

- 상세 API : https://www.notion.so/API-1c038a55a290414596167012c37fb277 <br>

|기능|Method|URL| Request Params / Body|
|:---|:---:|:---:|:---:|
|구글 로그인|GET|/auth/google||
|데일리 질문 받기(3개)|GET|/card/daily|cardId, topic, contents, createdUser, available, profileImg, answerCount, otherProfileImg|
|답변쓰기|POST|/card| questionId, contents, isOpen |
|프로필 수정|PATCH|/myPage/profile| id, nickname, profileImg, introduce, topic |
|내 책장 월별 확인|GET|/bookshelf/books/:YYMMD| books : [{ id, count }] |
|카드 디테일|GET|/bookshelf/bookCardDetail/:answerId| questionCreatedUserId, questionCreatedUserNickname, name, profileImg, questionTopic, questionContents, answerId, ansewrContents, answerUserProfileImg, nickname, isOpen, like, likeCount |
|유저 검색|GET|/bookshelf/searchUser | userInfo:[{ profileImg, introduce, nickname, userId }] |
|친구 추가 |POST|/bookshelf/addfriend |  |
|좋아요 클릭|POST|/bookshelf/like/answerCard| answerCardId, likeCountNum, currentLike] |
|내 답변 삭제하기|DELETE|/card/myAnswer/:answerId| |
|내 답변 수정하기|PATCH|/card/myAnswer/| |
|커뮤니티-랜덤 질문카드 2개뽑기|GET|/ourPlace/cards| result:[{ questions, quesitonId, contents, topic, nickname}], answers:[{ userId, profileImg, nickname, answerId, contents}] |
|댓글 리스트|GET|/comment/:cardId?page=number| comments:[{ commentId, commentContents, userId, tag, nickname, commentLikeCOunt, commentLike, profileImg }] |
|댓글 작성|POST|/commentId/:cardId| |



## 힘들었던 점 및 개선 사항
#### 인앱링크 탈출 (ftp 서버)
- 인앱 브라우저에서는 구글 및 소셜 로그인이 잘 안되는 경우가 있었습니다. 또한 프로필 사진 변경 간 사진 업로드가 안되는 경우도 있었습니다.  그래서 안드로이드 같은 경우, 주소에 intent와 app 패키지 이름을 통해 인앱을 빠져나갈 수 있었고 아이폰 같은 경우 주소의 시작이 ftp:// 인 경우, 기본 브라우저로 열리게 되는데, 그때문에 ftp 서버를 추가할 필요가 있었습니다. vsftpd를 사용하여 ftp 서버를 구축하였고 리다이렉션하는 파일을 만들어 인앱을 감지하면, ftp:// 로 인앱을 빠져나오고 기본 브라우저가 리다이렉션하는 파일을 불러와서 원래주소로 리다이렉션하게 되도록 하였습니다.

#### 서버 성능 개선
- 부하가 걸릴경우를 대비하여 nginx를 load Balancer로 사용하였습니다. nginx의 proxy기능을 통해 외부에서 들어오는 요청을 내부 서버 IP로 가리키도록 하였습니다. 
- 사용자가 프로필 사진을 변경하면 서버에서는 multer-s3 라이브러리를 사용하여 S3저장소에 파일을 업로드하고, DB에 그 위치를 저장하도록 하였습니다. 어떤 사진이든 바로 저장하다 보니, 사용자가 불러올 사진의 크기가 매우 컸고 개선할 필요가 있었습니다. 해결책으로 sharp 라이브러리를 사용하여 적은 용량으로 사진을 리사이징하여 저장하였습니다. 결과적으로, 사용자에게 더 빠르게 페이지를 보여줄 수 있었습니다.
- 반복문 내에서 반복이 될때마다 DB를 불러오는 코드가 있었고 눈에 띌 정도는 아니지만 순차적으로 실행이 되었기에 성능 개선을 할 필요가 느껴졌습니다. 이를 해결하기위해 Promise.all 과 map 함수를 사용하여 동기적인 실행을 비동기 처리로 전환하여 성능을 개선하였습니다.       
- 메인 페이지에서 사용자에게 매일 새로운 질문을 3개씩 주어지는데, 재접속 하더라도 고정적으로 질문을 보여주기위해 데이터베이스에 저장하였습니다. 하루가 지나면 기존에 있던 데이터는 필요가 없어 져 의미없는 데이터가 되었고 불필요한 공간을 차지하였습니다. 이를 개선하기 위해, crontab을 사용하여 매일 한 번씩 이전 데이터를 지우는 코드를 실행시켜 DB 성능을 향상시켰습니다. 

#### 보안
- 사용자와 안전하게 데이터를 주고 받을 수 있도록 https를 사용하였습니다. 다행히 nginx를 proxy서버로 사용하고 있어 비교적 쉽게 ssl 인증서를 등록 하였습니다. cerbot 패키지를 사용하여 SSL인증서를 발급 받을 수 있었고, 90일 마다 자동으로 갱신 되도록 crontab 작업리스트에 추가하였습니다.
- 처음에는 사용자 인증을 세션-쿠키 방식으로 구현했었습니다. DB에 추가적인 공간이 필요한 점, 세션을 별도로 관리해야 하는 점 때문에 JWT 방식을 사용하여 브라우저에 쿠키영역에 사용자의 고유값을 저장하도록 하였습니다. 그리고 나서 사용자 권한을 필요로 하는 작업에 토큰을 받아 유효한 사용자인지 판별하였습니다. 
- 크로스 사이트 스크립팅(XSS)은 웹 애플리케이션에서 많이 나타나는 취약점의 하나로 웹사이트관리자가 아닌 사용자가 웹페이지에 악성 스크립트를 삽입할 수 있는 취약점입니다. 그래서 sanitize-html라이브러리를 사용하여 데이터의 입력과 출력이 필요한 부분에 스크립트 방지 처리를 하여 보안적인 부분을 개선하였습니다.  

#### 소켓통신
- 실시간 알림에 socket.io 라이브러리를 사용하여 구현하였습니다. 알림의 종류가 6가지가 있었는데, 공통적으로 처리할 수 있도록 DB설계 부분에서 많은 신경을 썼습니다. 이벤트 타입에 대한 key를 만들어 구분하여 저장하고 중복될 수 있는 코드를 모듈화 하여 이벤트처리 하였습니다. 소켓 통신에 필요한 room에 대한 모듈을 각 api로 불러오기 힘들었는데, 이를 미들웨어로 사용하여 문제를 해결 하였습니다. 

#### MongoDB Aggregate
- 기존의 find와 같은 함수로 한번에 원하는 결과를 조회할 수 없었던 경우가 있었습니다. mongoDB에 종속된 문법이기는 하지만, 코드의 가독성과 빠른 처리를 위하여 aggregate 문법을 사용하였습니다. $sample로 무작위로 데이터를 추출하고, $lookup을 통해 필요한 정보를 추가적으로 찾아 올 수 있었습니다. 사용자의 요청에 따라 정렬을 다르게 할 때, 공통적인 코드를 별도로 만들어 중복된 코드를 줄일 수도 있었습니다. 

## 프로젝트 상세 설명 페이지
- https://www.notion.so/5ba8f469ecb346109d73439c05c095e6

## Front-End(React) 코드 
- https://github.com/DabinLim/mind_bookshelf
