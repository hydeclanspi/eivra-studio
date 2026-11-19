package com.eivra.studio.v2
import com.eivra.studio.v2.api.*
import org.junit.Assert.*
import org.junit.Test
class RoutesTest {
 @Test fun everyWebRouteRoundTrips(){ Route.entries.forEach{assertEquals(it,Route.fromPath(it.path+"/?tour=0#top"))};assertEquals(Route.entries.size,Route.entries.map{it.path}.distinct().size) }
 @Test fun rootAndLegacyAliases(){assertEquals(Route.New,Route.fromPath("/?tour=0"));assertEquals(Route.Quants,Route.fromPath("/dashboard/quants"));assertNull(Route.fromPath("/unknown"))}
 @Test fun subpagesDoNotBecomeIndependentPrimaryTabs(){assertEquals("Dashboard",Route.Seasons.section);assertEquals("History",Route.Teams.section);assertEquals(7,Route.entries.map{it.section}.distinct().size)}
}