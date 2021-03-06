/**
 * @description tweet view route
 * @author Zhenhan Li
 */

const router = require('koa-router')()
const { loginRedirect } = require('../../middlewares/loginChecks')
const { getProfileBlogList } = require('../../controller/blog-profile')
const { getSquareBlogList } = require('../../controller/blog-square')
const { isExist } = require('../../controller/user')
const { getFans, getFollowers } = require('../../controller/user-relation')
const { getHomeBlogList } = require('../../controller/blog-home')
const { getAtMeCount, getAtMeBlogList, markAsRead  } = require('../../controller/blog-at')

// index
router.get('/', loginRedirect, async (ctx, next) => {
    const userInfo = ctx.session.userInfo
    const { id: userId } = userInfo

    // retrieve first page data
    const result = await getHomeBlogList(userId)
    const { isEmpty, blogList, pageSize, pageIndex, count } = result.data

    // get followers
    const fansResult = await getFans(userId)
    const { count: fansCount, userList:fansList } = fansResult.data

    // get following
    const followersResult = await getFollowers(userId)
    const { count: followersCount, followersList } = followersResult.data

    // get @ number 
    const atCountResult = await getAtMeCount(userId)
    const { count: atCount } = atCountResult.data

    await ctx.render('index', {
        userData: {
            userInfo,
            fansData: {
                count: fansCount,
                list: fansList
            },
            followersData: {
                count: followersCount,
                list: followersList
            },
            atCount
        },
        blogData: {
            isEmpty,
            blogList,
            pageSize,
            pageIndex,
            count
        }
    })
})

// visit personal home page
router.get('/profile', loginRedirect, async (ctx, next) => {
    const { userName } = ctx.session.userInfo
    ctx.redirect(`/profile/${userName}`)
})

router.get('/profile/:userName', loginRedirect, async (ctx, next) => {
    // signed in's  user info
    const myUserInfo = ctx.session.userInfo
    const myUserName = myUserInfo.userName 

    let curUserInfo
    const { userName: curUserName } = ctx.params 
    const isMe = myUserName === curUserName 

    if (isMe) {
        curUserInfo = myUserInfo
    } else {
        const existResult = await isExist(curUserName)
        if (existResult.errno !== 0) {
            return 
        }
        curUserInfo = existResult.data
    }
    // retrieve twitter first page
    const result = await getProfileBlogList(curUserName, 0)
    const { isEmpty, blogList, pageSize, pageIndex, count } = result.data

    // head to controller and retrieve fans data
    const fansResult = await getFans(curUserInfo.id)
    const { count: fansCount, userList: fansList} = fansResult.data

    // retrieve following list
    const followersResult = await getFollowers(curUserInfo.id)
    const { count: followersCount, followersList} = followersResult.data

    // have I followed this person? 
    const amIFollowed = fansList.some(item => {
        return item.userName === myUserName
    })

    // get @ number 
    const atCountResult = await getAtMeCount(myUserInfo.id) 
    const { count: atCount } = atCountResult.data 

    
    
    await ctx.render('profile', {
        blogData: {
            isEmpty,
            blogList,
            pageSize,
            pageIndex,
            count
        },
        userData: {
            userInfo: curUserInfo,
            isMe,
            fansData: {
                count: fansCount,
                list: fansList
            },
            followersData: {
                count: followersCount,
                list: followersList
            },
            amIFollowed,
            atCount
        }
    })
})

//square 
router.get('/square', loginRedirect, async (ctx, next) => {
    // retrieve twitter data, first page
    const result = await getSquareBlogList(0)
    const { isEmpty, blogList, pageSize, pageIndex, count } = result.data || {}

    await ctx.render('square', {
        blogData: {
            isEmpty,
            blogList,
            pageSize,
            pageIndex,
            count
        }
    })
})


// atMe router
router.get('/at-me', loginRedirect, async (ctx, next) => {
    const { id: userId } = ctx.session.userInfo

    // get @ number
    const atCountResult = await getAtMeCount(userId)
    const { count: atCount } = atCountResult.data

    // get first page list
    const result = await getAtMeBlogList(userId)
    const { isEmpty, blogList, pageSize, pageIndex, count } = result.data

    // render page
    await ctx.render('atMe', {
        atCount,
        blogData: {
            isEmpty,
            blogList,
            pageSize,
            pageIndex,
            count
        }
    })

    // mark as read
    if (atCount > 0) {
        await markAsRead(userId)
    }
})

module.exports = router

