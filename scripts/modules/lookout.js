
import { MODULE } from '../module.js'
import { Logistics } from './logistics.js'
import { logger } from './logger.js'

const NAME = 'Lookout';

export class Lookout {

  static register() {
    Lookout.defaults();
    Lookout.hooks();
    Lookout.settings();
  }

  static hooks() {
    /* delay until all modules loaded (i.e. warpgate) */
    Hooks.once('ready', () => {
      Hooks.on('preUpdateToken', Lookout._preUpdateToken);
      Hooks.on('updateToken', Lookout._updateToken);
      Hooks.on('deleteToken', Lookout._deleteToken);

      warpgate.event.watch(MODULE[NAME].leaderMoveEvent, Logistics.handleLeaderMove, Logistics.containsOwnedFollower);

      warpgate.event.watch(MODULE[NAME].addFollowerEvent, Logistics.handleAddFollower, Logistics.leaderFirstOwner);

      warpgate.event.watch(MODULE[NAME].addLeaderEvent, Logistics.handleAddLeader, Logistics.followerFirstOwner);

      warpgate.event.watch(MODULE[NAME].removeFollowerEvent, Logistics.handleRemoveFollower, Logistics.leaderFirstOwner);

      warpgate.event.watch(MODULE[NAME].removeLeaderEvent, Logistics.handleRemoveLeader, Logistics.followerFirstOwner);
    });
  }

  static defaults() {
    MODULE[NAME] = {
      leaderMoveEvent: 'sq-leader-move',
      followerPauseEvent: 'sq-follow-pause',
      addFollowerEvent: 'sq-add-follower',
      addLeaderEvent: 'sq-add-leader',
      removeFollowerEvent: 'sq-remove-follower',
      removeLeaderEvent: 'sq-remove-leader',
      followersFlag: 'followers',
      leadersFlag: 'leaders',
      followPause: 'paused',
    }
  }

  static settings() {

  }

  static _deleteToken(tokenDoc, options, user){

    /* only handle our initiated moves */
    if (user != game.user.id) return;

    /* am I a leader? */
    const followers = tokenDoc.getFlag(MODULE.data.name, MODULE[NAME].followersFlag) ?? []
    if (followers.length > 0) {

      logger.debug('Notifying followers of leader remove. Leader:', tokenDoc, 'Followers:', followers);
      /* notify each follower that their leader is being removed */
      followers.forEach( (followerId) => {
        warpgate.plugin.queueUpdate( () => {
          return warpgate.event.notify(MODULE[NAME].removeLeaderEvent,
            {
              leaderId: tokenDoc.id,
              followerId,
              sceneId: tokenDoc.parent.id
            });
        });
      });
    }

    /* am I a follower? */
    Logistics.announceStopFollow(tokenDoc);
  }

  static _preUpdateToken(tokenDoc, update, options, user) {
    if (update.x || update.y) {
      /* store 'old' location */
      const {x,y} = tokenDoc.object.center;
      mergeObject(options, {oldLoc: {x,y}});
    }
  }

  static _updateToken(tokenDoc, update, options, user) {

    /* only handle our initiated moves */
    if (user != game.user.id) return;
    
    if (update.x || update.y) {

      /* am I a leader? */
      const followers = tokenDoc.getFlag(MODULE.data.name, MODULE[NAME].followersFlag) ?? []
      if (followers.length > 0) {

        const oldLoc = options.oldLoc;

        const newLoc = tokenDoc.object.center;
        const followVector = Logistics.createFollowVector(newLoc, oldLoc)

        const data = {
          leader: {
            tokenId: tokenDoc.id,
            sceneId: tokenDoc.parent.id,
            finalPosition: newLoc,
            followVector
          },
          followers,
        }

        warpgate.plugin.queueUpdate( async () => {
          await warpgate.event.notify(MODULE[NAME].leaderMoveEvent, data);
        });
      }
      // FOLLOWERS
      if (options.squadronEvent == MODULE[NAME].leaderMoveEvent) {
        
        /* do not respond to our own move events */
        return;
      }

      /* am I a follower? */
      const leaders = tokenDoc.getFlag(MODULE.data.name, MODULE[NAME].leadersFlag) ?? {};
      if (Object.keys(leaders).length > 0){

        /* I am following someone and have moved independently of them -> Pause */
        warpgate.plugin.queueUpdate( async () => {
          await tokenDoc.setFlag(MODULE.data.name,MODULE[NAME].followPause,true);
        });
      }
    }
  }

  static async addFollower(leaderId, followerId, sceneId){

    /* ask for orientation */
    const dialogData = {
      buttons: [{
        label: MODULE.localize('orientation.left'),
        value: {x:1, y:0}
      },{
        label: MODULE.localize('orientation.up'),
        value: {x:0, y:-1}
      },{
        label: MODULE.localize('orientation.down'),
        value: {x:0, y:1}
      },{
        label: MODULE.localize('orientation.right'),
        value: {x:-1, y:0}
      }],
      title: MODULE.localize('orientation.title')
    }

    const orientationVector = await warpgate.buttonDialog(dialogData);

    /* dialog was cancelled */
    if (orientationVector === true) return;
    logger.debug('Behind vector', orientationVector);

    const eventData = {
      leaderId,
      followerId,
      sceneId,
      orientationVector //leader does not care about this
    }

    /* trigger all relevant events */
    await warpgate.event.notify(MODULE[NAME].addFollowerEvent, eventData);
    await warpgate.event.notify(MODULE[NAME].addLeaderEvent, eventData);
  }
}
