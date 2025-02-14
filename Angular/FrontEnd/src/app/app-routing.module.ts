import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SinginComponent } from './frontend/singin/singin.component';
import { SingupComponent } from './frontend/singup/singup.component';
import { PriceComponent } from './frontend/price/price.component';
import { BlogComponent } from './frontend/blog/blog.component';
import { AboutComponent } from './frontend/about/about.component';
import { TeamComponent } from './frontend/team/team.component';
import { HomeComponent } from './frontend/home/home.component';
import { FeatureComponent } from './frontend/feature/feature.component';
import { TestimonialComponent } from './frontend/testimonial/testimonial.component';
import { CandidatureComponent } from './frontend/candidature/candidature.component';

const routes: Routes = [
  { path: '', component: HomeComponent }, // Page d'accueil
  { path: 'signin', component: SinginComponent },
  { path: 'signup', component: SingupComponent },
  { path: 'price', component: PriceComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'about', component: AboutComponent },
  { path: 'team', component: TeamComponent },
  { path: 'feature', component: FeatureComponent },
  { path: 'testimonial', component: TestimonialComponent },
  { path: 'candidature', component: CandidatureComponent},

  { path: '**', redirectTo: '', pathMatch: 'full' } // Redirection vers Home en cas d'erreur
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
